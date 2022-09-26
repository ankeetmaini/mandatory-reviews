import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from '@octokit/core'
import * as All from '@octokit/types'

type reviewsResponse =
  All.Endpoints['GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews']['response']

async function run(): Promise<void> {
  try {
    const usernames: string = core.getInput('usernames')
    const group = usernames.split(',')
    const count = Number(core.getInput('count'))

    const octokit = new Octokit({auth: process.env.GITHUB_TOKEN})
    const [owner, repo] = process.env.GITHUB_REPOSITORY!.split('/')
    console.log(owner, repo)
    const pull_number = github.context.issue.number
    console.log(pull_number)
    const res: reviewsResponse = await octokit.request(
      'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews',
      {
        owner,
        repo,
        pull_number,
        per_page: 100
      }
    )
    console.log(res.data)
    const reviews = res.data
      .map(d => {
        const login = d?.user?.login
        const state = d?.state

        if (login && group.includes(login) && state === 'APPROVED') {
          return login
        }
        return
      })
      .filter(Boolean)
    if (reviews.length < count) core.setFailed('Mandatory review check failed')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
