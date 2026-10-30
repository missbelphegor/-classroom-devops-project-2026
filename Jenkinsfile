
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'GitHub source code connected successfully'
            }
        }

        stage('Maven Build') {
            steps {
                sh 'mvn clean package'
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t classroom-issue-reporting:latest .'
            }
        }
    }

    post {
        success {
            echo 'Classroom Issue Reporting CI/CD Successful!'
        }
        failure {
            echo 'Pipeline failed. Check Console Output.'
        }
    }
}