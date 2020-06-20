import fs from 'fs'
import * as core from '@actions/core'
import { getOctokit } from '@actions/github'

const { GITHUB_EVENT_PATH, GITHUB_REPOSITORY } = process.env as { GITHUB_EVENT_PATH: string; GITHUB_REPOSITORY: string }

const { debug }  = core;

const run = async () => {
  try {
    const client = getOctokit(core.getInput('repo-token', { required: true }))
    const ghEvent = JSON.parse(await fs.promises.readFile(GITHUB_EVENT_PATH, 'utf8')) as {}
    const prData = isPullRequest(ghEvent)
      ? ghEvent.pull_request
      : isPullRequestReview(ghEvent)
      ? ghEvent.pull_request_review.pull_request
      : undefined

    if (prData === undefined) {
      throw new Error('Failed to extract pull request data.')
    }

    const prNumber = prData.number;
    const [repoOwner, repoName] = GITHUB_REPOSITORY.split('/')

    const reviewList = await client.pulls.listReviews({
      pull_number: prNumber,
      repo: repoName,
      owner: repoOwner
    })

    const reviews = reviewList.data.filter(review => {
      if(review.user.login === 'rnd-johnny5') return false;
      // @ts-ignore
      return collaboratorAssociation.includes(review.author_association);
    });


    debug(`${reviews.length} total valid reviews`)

    const alreadyReviewed: string[] = [];
    /**
     * Filters duplicates and non-valid reviews (non-valid are comments and other stuff)
     */
    const filteredReviews = reviews.filter((review) => {
      if(!isValidReviewState(review.state)) return false;
      if(alreadyReviewed.includes(review.user.login)) return false;
      alreadyReviewed.push(review.user.login);
      return true;
    })

    filteredReviews.forEach((review) => console.log('Found Review from ' + review.user.login + ' they ' + review.state))

    let validReviews = 0;
    Object.keys(ReviewState)
      .forEach(stateName => {
        const stateReviewsCount = filteredReviews.filter(review => review.state === ((stateName as unknown) as ReviewState))
          .length
        const outputKey = stateName.toLowerCase()
        debug(`  ${outputKey}: ${stateReviewsCount.toLocaleString('en')}`)
        core.setOutput(outputKey, stateReviewsCount)
        if(isValidReviewState(stateName)) validReviews += stateReviewsCount;
      })
    core.setOutput('valid_reviews', validReviews);
  } catch (err) {
    core.setFailed(err)
  }
}

const validReviews = ['APPROVED', 'CHANGES_REQUESTED'];

function isValidReviewState(state: string) {
  return validReviews.includes(state);
}

enum ReviewState {
  APPROVED = 'APPROVED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  COMMENTED = 'COMMENTED',
  DISMISSED = 'DISMISSED',
  PENDING = 'PENDING'
}

enum CommentAuthorAssociation {
  COLLABORATOR = 'COLLABORATOR',
  CONTRIBUTOR = 'CONTRIBUTOR',
  FIRST_TIME_CONTRIBUTOR = 'FIRST_TIME_CONTRIBUTOR',
  FIRST_TIMER = 'FIRST_TIMER',
  MEMBER = 'MEMBER',
  OWNER = 'OWNER',
  NONE = 'NONE'
}

const collaboratorAssociation: CommentAuthorAssociation[] = [
  CommentAuthorAssociation.COLLABORATOR,
  CommentAuthorAssociation.MEMBER,
  CommentAuthorAssociation.OWNER,
  CommentAuthorAssociation.CONTRIBUTOR
]

/**
 * Is this a pull request event?
 *
 * @param payload - GitHub action event payload.
 * @returns `true` if it's a PR.
 */
const isPullRequest = (
  payload: Record<string, unknown>
): payload is {
  pull_request: {
    number: number
  }
} => payload.pull_request !== undefined

/**
 * Is this a pull request review event?
 *
 * @param payload - GitHub action event payload.
 * @returns `true` if it's a PR review.
 */
const isPullRequestReview = (
  payload: Record<string, unknown>
): payload is {
  pull_request_review: {
    pull_request: {
      number: number
    }
  }
} => payload.pull_request_review !== undefined

// Run the action
run()
