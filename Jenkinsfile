pipeline {
    agent { docker { image 'node' } }
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
