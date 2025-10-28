const core = require('@actions/core');
const github = require('@actions/github');
const { findNoiseFiles, formatNoiseOutput } = require('./scripts/detectNoise');
const fs = require('fs');

async function run() {
  try {
    const token = core.getInput('github-token');
    const ignoreFile = core.getInput('ignore-file');
    const maxFilesPerDir = parseInt(core.getInput('max-files-per-dir') || '3');
    const groupThreshold = parseInt(core.getInput('group-threshold') || '3');
    
    // Detect noise files
    const noiseFiles = findNoiseFiles('.', ignoreFile);
    
    // Set outputs
    core.setOutput('noise-found', noiseFiles.length > 0);
    core.setOutput('noise-files', JSON.stringify(noiseFiles));
    
    // Comment on PR if noise found
    if (noiseFiles.length > 0) {
      const output = formatNoiseOutput(noiseFiles, { maxFilesPerDir, groupThreshold });
      
      const octokit = github.getOctokit(token);
      const context = github.context;
      
      if (context.payload.pull_request) {
        await octokit.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: context.payload.pull_request.number,
          body: output
        });
        
        core.info('Posted comment to PR');
      }
    } else {
      core.info('No noise files detected');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();