pipeline {
    agent any

    environment {
        IMAGE_NAME = 'abdullahilashik/devops:latest'
    }

    stages {
        stage('Prepare') {
            steps {
                echo 'Just some formalities for the echo!'
                echo '${IMAGE_NAME}'
            }
        }

        stage('Dependency Installation') {
            steps {
                echo 'Install dependencies for testing'
            }
        }

        stage('Linting') {
            steps {
                sh 'java -version'
            }
        }

        stage('Build') {
            steps {
                sh 'echo Build with maven'
            }
        }
    }
}