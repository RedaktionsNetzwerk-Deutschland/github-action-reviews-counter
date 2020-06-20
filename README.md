# Reviews Counter GitHub Action

Action to provide review counts for pull requests.

- Only reviews from collaborators, organization members, or repo owners are counted.
- **Reviews from contributors without collaborator access are intentionally ignored.**

## Usage

### Action Outputs

This action [outputs](https://help.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#outputs)
the following values as **integers**:

- **approved:** Reviews allowing the pull request to merge.
- **changes_requested:** Reviews blocking the pull request from merging.
- **commented:** Informational reviews.
- **dismissed:** Reviews that have been dismissed.
- **pending:** Reviews that have not yet been submitted.

### Example Workflow

This action works only with **pull_request** and **pull_request_review** events.

```yaml
on:
  pull_request:
    types:
      - 'labeled'
      - 'ready_for_review'
  pull_request_review:
    types:
      - 'edited'
      - 'dismissed'
      - 'submitted'
jobs:
  your-action:
    runs-on: 'ubuntu-latest'
    steps:
      - id: 'reviews'
        uses: 'RedaktionsNetzwerk-Deutschland/github-action-reviews-counter@main'
        with:
          repo-token: '${{ secrets.GITHUB_TOKEN }}'
      - # Conditionally run the next step
        if: 'steps.reviews.outputs.approved >= 1 && steps.reviews.outputs.changes_requested == 0'
        uses: 'SOME_OTHER_ACTION'
```

## License

[ISC](https://github.com/jrylan/github-action-reviews-counter/blob/main/LICENSE.md)
