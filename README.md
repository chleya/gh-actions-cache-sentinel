# GitHub Actions Cache Sentinel

A zero-dependency composite JavaScript action for pruning closed-PR cache fragments and publishing a readable storage/ROI card to `GITHUB_STEP_SUMMARY`.

## Usage

```yaml
permissions:
  actions: write
  contents: read
steps:
  - uses: chleya/gh-actions-cache-sentinel@main
    with:
      github-token: ${{ secrets.GITHUB_TOKEN }}
      prune-on-pr-close: 'true'
```

The included workflow runs on closed pull requests and every Sunday. It enumerates all caches through the REST API, deletes caches whose ref is the closed PR merge ref, then measures the remaining footprint against GitHub's 10 GiB repository cache budget. The action is intentionally dependency-free and uses the Node 20 runtime's native `fetch`.

## Marketplace readiness
The repository includes `action.yml`, a clear input contract, least-privilege workflow permissions, and no vendored third-party runtime. Before Marketplace publication, add a release tag and a public issue/security policy.

## Polar.sh team extension
A hosted team plan can add organization-level reporting, retention policies, Slack alerts, and multi-repository net-ROI reporting. Keep the open-source action as the local enforcement layer and charge teams for centralized policy and reporting.
