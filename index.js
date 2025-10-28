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
    const updateComment = core.getInput('update-comment') === 'true';
    
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
        let commentId = null;
        
        if (updateComment) {
          // Find existing comment from this action
          const { data: comments } = await octokit.rest.issues.listComments({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: context.payload.pull_request.number
          });
          
          const existingComment = comments.findLast(comment => 
            comment.user.type === 'Bot' && 
            comment.body.startsWith('⚠️ Found') &&
            comment.body.includes('potentially superfluous files') &&
            comment.body.includes('🧹 Consider removing')
          );
          
          if (existingComment) {
            commentId = existingComment.id;
          }
        }
        
        if (commentId) {
          // Update existing comment
          await octokit.rest.issues.updateComment({
            owner: context.repo.owner,
            repo: context.repo.repo,
            comment_id: commentId,
            body: output
          });
          core.info('Updated existing PR comment');
        } else {
          // Create new comment
          await octokit.rest.issues.createComment({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: context.payload.pull_request.number,
            body: output
          });
          core.info('Posted comment to PR');
        }
      }
    } else if (updateComment && context.payload.pull_request) {
      // Delete existing comment if no noise found
      const octokit = github.getOctokit(token);
      
      const { data: comments } = await octokit.rest.issues.listComments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.payload.pull_request.number
      });
      
      const existingComment = comments.findLast(comment => 
        comment.user.type === 'Bot' && 
        comment.body.startsWith('⚠️ Found') &&
        comment.body.includes('potentially superfluous files') &&
        comment.body.includes('🧹 Consider removing')
      );
      
      if (existingComment) {
        await octokit.rest.issues.deleteComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          comment_id: existingComment.id
        });
        core.info('Deleted existing PR comment (no noise found)');
      } else {
        core.info('No noise files detected');
      }
    } else {
      core.info('No noise files detected');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

// Only run if executed directly (not in tests)
if (require.main === module) {
  run();
}

module.exports = run;