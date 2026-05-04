#!/usr/bin/env node
// 文件头声明：告诉操作系统通过node执行我的自定义命令
import { program } from "commander"
import fs from "node:fs"
import inquirer from "inquirer"
const jsonFile = JSON.parse(fs.readFileSync("./package.json", "utf-8"))

program.version(jsonFile.version)
program
  .command("create <project-name>")
  .alias("c")
  .description("create a new project")
  .action((projectName) => {
    inquirer
      .prompt([
        {
          type: "input",
          name: "description",
          message: "请输入项目描述：",
        },
      ])
      .then((answers) => {
        console.log("项目名称：", projectName)
        console.log("项目描述：", answers.description)
      })
  })

program.parse() // 执行
