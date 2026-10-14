pipeline {
    agent any

    environment {
        IMAGE_NAME = 'abdullahilashik/devops:latest'
    }

    parameters {
        choice(name: 'ENVIRONMENT', choices: ['dev','stagging','production'], description: 'Pick a environment of your choice')
    }

    stages {
        stage('Prepare') {
            steps {
                echo 'Just some formalities for the echo!'
                echo "${IMAGE_NAME}"
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
                script {
                    if(params.ENVIRONMENT == 'dev') {
                        echo 'Build progress in dev server'
                    } else if(params.ENVIRONMENT === 'stagging') {
                        echo 'Build progress in stagging server'
                    } else if (params.ENVIRONMENT === 'production') {
                        echo 'Build progress in production server!'
                    }
                }
            }
        }
    }
}