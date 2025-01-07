import * as cdk from '@aws-cdk/core';
import * as amplify from "@aws-cdk/aws-amplify";
import * as cognito from "@aws-cdk/aws-cognito";

import * as route53 from "@aws-cdk/aws-route53";
import * as targets from '@aws-cdk/aws-route53-targets';
import * as certificatemanager from '@aws-cdk/aws-certificatemanager';

export class CdkInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);



    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'amplifyIOT_UserPool', {
      userPoolName: 'MyUserPool',
      selfSignUpEnabled: true, // Allow users to sign themselves up
      signInAliases: {
        username: false, // Disabling username as a sign-in method
        email: true, // Allow signing in with email
      },
      autoVerify: { 
        email: true, // Automatically verify email addresses
      },
      standardAttributes: {
        email: {
          required: true, // Email is required during sign-up
          mutable: false, // Email cannot be changed after sign-up
        },
      },
    });
    
    
    const userPoolClient = new cognito.UserPoolClient(this, 'amplifyIOT_UserPoolClient', {
      userPool,
      generateSecret: false,
    });

    // Cognito Identity Pool
    const identityPool = new cognito.CfnIdentityPool(this, 'amplifyIOT_IdentityPool', {
      allowUnauthenticatedIdentities: true,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        }
      ]
    });


    const amplifyApp = new amplify.App(this, 'cdkAmplifyIOT', {
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: 'anoopgottipati',
        repository: 'amplify_iot',
        oauthToken: cdk.SecretValue.secretsManager('my-github-amplify-token'),
      }),
      environmentVariables: {
        'IDENTITY_POOL_ID': identityPool.ref,
        'USER_POOL_ID': userPool.userPoolId,
        'USER_POOL_CLIENT_ID': userPoolClient.userPoolClientId,
        'REGION': this.region,
      }
    });

    //amplifyApp.addBranch("main");

    const mainBranch = amplifyApp.addBranch("main"); // Add and get the "main" branch

    // Lookup the Route 53 Hosted Zone for your domain
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'iotlink.click',
    });

    new cdk.CfnOutput(this, 'HostedZoneID', {
      value: hostedZone.hostedZoneId,
      description: 'The ID of the hosted zone',
    });
    
    new cdk.CfnOutput(this, 'HostedZoneName', {
      value: hostedZone.zoneName,
      description: 'The name of the hosted zone',
    });

    // Add custom domain to the Amplify app
    const domain = amplifyApp.addDomain('iotlink.click', {
      subDomains: [
        { branch: mainBranch, prefix: 'www' }, // Maps 'www.iotlink.click' to the main branch
      ],
    });

    // Map root domain (iotlink.click) to the main branch
    domain.mapRoot(mainBranch);

    
  }
}