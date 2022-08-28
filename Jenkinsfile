pipeline {
    agent { docker { image 'node:18-alpine:3.15' } }
      stages {
        stage('log version info') {
      steps {
        sh 'node -version'
        sh 'npm -version'
	sh 'npm install'
      }
    }
  }
}
