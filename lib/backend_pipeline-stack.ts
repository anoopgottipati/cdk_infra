import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import { Construct } from 'constructs';

export class BackendPipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Source action (GitHub repository)
        const sourceOutput = new codepipeline.Artifact();
        const sourceAction = new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub_Source',
        owner: 'anoopgottipati', // GitHub username
        repo: 'cdk_infra', // repository name
        branch: 'dev', // Default branch to trigger the pipeline
        oauthToken: cdk.SecretValue.secretsManager('my-github-backend-pipeline-token'), // GitHub OAuth token
        output: sourceOutput,
        });

        // CodeBuild project to synthesize and deploy the CDK app
        const cdkBuildProject = new codebuild.PipelineProject(this, 'CdkBuildProject', {
        environment: {
            buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        },
        buildSpec: codebuild.BuildSpec.fromObject({
            version: '0.2',
            phases: {
            install: {
                commands: [
                'npm install -g aws-cdk', // Install CDK globally
                'npm install', // Install dependencies
                ],
            },
            build: {
                commands: [
                'npm run build', // Build the CDK app
                'cdk synth', // Synthesize the CDK app
                'cdk deploy --require-approval never', // Deploy the CDK app without manual approval
                ],
            },
            },
        }),
        });

        // Build action
        const cdkBuildAction = new codepipeline_actions.CodeBuildAction({
        actionName: 'CDK_Build_And_Deploy',
        project: cdkBuildProject,
        input: sourceOutput,
        });

        // Pipeline creation
        const pipeline = new codepipeline.Pipeline(this, 'BackendPipeline', {
        pipelineName: 'BackendPipeline',
        stages: [
            {
            stageName: 'Source',
            actions: [sourceAction],
            },
            {
            stageName: 'Build_And_Deploy',
            actions: [cdkBuildAction],
            },
        ],
        });
    }
}