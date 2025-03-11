# Use an official Node.js image as a base image
FROM node:23

# Set the working directory inside the container
WORKDIR /app

# Install the specific AWS CDK version used in your project
RUN npm install -g aws-cdk@2.138.0  # Match this version to your project's CDK version

# Install dependencies for your CDK app
COPY package*.json ./
RUN npm install

# Copy the rest of the app files into the container
COPY . .

# Set the default command to run when the container starts
# CMD ["cdk", "--help"]
# ENTRYPOINT ["/bin/bash"]
# CMD ["sh", "-c", "cd harness-cicd/cdk && npm install && cdk synth"]
#CMD ["/bin/sh"]
CMD ["sh", "-c", "cd harness-cicd/cdk && npm install && cdk deploy --require-approval never"]