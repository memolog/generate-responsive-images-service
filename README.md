# Generate responsive images
Generate static responsive images from one original image on localhost (only support for Mac)

```
git@github.com:memolog/generate-responsive-images.git
npm install
npm start
```

1. Go localhost:3000 and select some photo and push 'submit' button
2. Get responsive images like the following

![Capture](https://memolog.github.com/blog/assets/images/generate-responsive-images.png)

# Installation for Serverless API
## Install AWS CLI

[Installing the AWS Command Line Interface](https://docs.aws.amazon.com/cli/latest/userguide/installing.html)

# Deploy to CloudFormation
## Attach inline policy
Attach an inline policy to deploy like the `./cloud_formation/inline-policy.json`. You must see the policy and edit it for your own purpose

## Set your access key and secret in the `~/.aws/config` file like the following
```
[profile responvie-images]
region = ap-northeast-1
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

## Create S3 bucket to package lambda function

You should replace `{your-bucket-name}` with an unique bucket name.
You can do the same thing in AWS management console.

```
aws s3 mb s3://{your-bucket-name}
```

```
aws cloudformation package --template-file template.yaml --output-template-file output-template.yaml --s3-bucket generate-responsive-images-deploy --profile responsive-images
aws cloudformation deploy --template-file output-template.yaml --stack-name generate-responsive-images --capabilities CAPABILITY_NAMED_IAM --profile responsive-images
```

# Uninstall Cloud Formation
## Remve S3 bucket for packaging
```
aws s3 rm s3://{your-bucket-name} --recursive
aws s3 delete-bucket s3://{your-bucket-name}
```

## Remove Stack
```
aws cloudformation delete-stack  --stack-name generate-responsive-images --profile responsive-images
```