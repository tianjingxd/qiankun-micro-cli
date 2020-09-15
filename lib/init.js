const ora = require('ora')
const inquirer = require('inquirer')
const chalk = require('chalk')
const request = require('request')
const download = require('download-git-repo')
const install = require('./install')
const handlebars = require('handlebars')
const fs = require('fs')

module.exports = () => {
  request({
    url: 'https://api.github.com/users/template-qiankun-microApp/repos',
    headers: {
      'User-Agent': 'qiankun-micro-cli'
    }
  }, (err, res, body) => {
    if (err) {
      console.log(chalk.red('查询模版列表失败'))
      console.log(chalk.red(err))
      process.exit()
     } else {
      let tplNames = []
      const reqBody = JSON.parse(body)
      reqBody.forEach(ele => {
        tplNames.push(ele.name)
      })
      let promptList = [
        {
          type: 'list',
          name: 'tplName',
          message: '请选择模版',
          choices: tplNames
        },
        {
          type: 'input',
          message: '请输入项目名称',
          name: 'name',
          default: 'qiankun-micro-app'
        },
        {
          type: 'input',
          message: '请输入项目描述',
          name: 'description',
          default: '这是一个qiankun子应用模版'
        },
        {
          type: 'input',
          message: '请输入作者名',
          name: 'author',
          default: '这是一个qiankun子应用模版'
        }
      ]
      inquirer.prompt(promptList).then(answers => {
        const tplItem = reqBody.find(ele => ele.name === answers.tplName)
        let gitUrl = `${tplItem.full_name}#${tplItem.default_branch}`
        let defaultUrl = './'
        let projectUrl = `${defaultUrl}/${answers.name}`
        const spinner = ora('\n 正在初始化项目，请稍后...')
        
        spinner.start()
  
        download(gitUrl, projectUrl, error => {
          spinner.stop()
          if (error) {
            console.log(chalk.red('模板下载失败'))
            console.log(chalk.red(error))
            process.exit()
          } else {
            console.log(chalk.green(`${answers.name}模板初始化成功`))
            console.log()
            // 模版初始化成功之后，把问题结果写入package.json
            // 1. handlerbars插件
            let terminalPath = process.cwd()
            const projectPath = `${terminalPath}/${answers.name}`
            const readResult = fs.readFileSync(projectPath + '/package.json', 'utf8')
            const configItem = {
              name: answers.name,
              author: answers.author,
              description: answers.description
            }
            const templateCompile =  handlebars.compile(readResult)
            const replaceResult = templateCompile(configItem)
            // 写回package.json
            fs.writeFileSync(projectPath + '/package.json', replaceResult)
            // 安装依赖 
            install({cwd: projectPath}).then(() => {
              console.log()
              console.log(chalk.green(`cd ${answers.name} && npm run serve`))
              console.log()
            })
          }
        })
      })
    }
  })
}
