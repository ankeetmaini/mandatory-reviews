//@ts-nocheck
import * as core from '@actions/core'
import * as github from '@actions/github'
import * as All from '@octokit/types'
import fetch from 'node-fetch'

type reviewsResponse =
  All.Endpoints['GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews']['response']

async function run(): Promise<void> {
  try {
    const usernames: string = core.getInput('usernames')
    const group = usernames.split(',')
    const count = Number(core.getInput('count'))
    const [owner, repo] = process.env.GITHUB_REPOSITORY!.split('/')
    console.log(owner, repo)
    const pull_number = github.context.issue.number
    console.log(pull_number)

    var requestOptions = {
      method: 'GET',
      headers: {
        Authorization: process.env['GITHUB_TOKEN'] as string,
        Accept: 'application/vnd.github.v3+json'
      },
      redirect: 'follow'
    }

    fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/reviews`,
      requestOptions as any
    )
      .then(response => response.json())
      .then(res => {
        const reviews = res
          .data!.data!.map((d: {user: {login: any}; state: any}) => {
            const login = d?.user?.login
            const state = d?.state

            if (login && group.includes(login) && state === 'APPROVED') {
              return login
            }
            return
          })
          .filter(Boolean)
        if (reviews.length < count)
          core.setFailed('Mandatory review check failed')
      })
      .catch(error => console.log('error', error))
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
