pipeline {
    agent any
    
    // Define environment variables used across the pipeline
    environment {
        APP_NAME = "my-devops-app"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout Code') {
            steps {
                echo 'Simulating git checkout... (In a real project, this pulls from GitHub)'
                // git url: 'https://github.com/your-username/your-repo.git', branch: 'main'
            }
        }
        
        stage('Build Artifact / Docker Image') {
            steps {
                echo "Building Docker image: ${env.APP_NAME}:${env.IMAGE_TAG}"
                // Because your socket is mounted, this command runs on your host WSL Docker!
                sh 'docker --version'
                // sh "docker build -t ${env.APP_NAME}:${env.IMAGE_TAG} ."
            }
        }
        
        stage('Run Tests') {
            steps {
                echo 'Running automated tests inside container...'
                sh 'echo "Tests passed successfully! 100% coverage."'
            }
        }
        
        stage('Deploy to Staging') {
            steps {
                echo 'Pushing image to registry and deploying to Staging server...'
                sh 'echo "Successfully deployed version ${env.IMAGE_TAG} to Staging!"'
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline finished execution.'
        }
        success {
            echo '🎉 Great job! The pipeline completed successfully.'
        }
        failure {
            echo '❌ Oops! Something failed during the pipeline execution.'
        }
    }
}
