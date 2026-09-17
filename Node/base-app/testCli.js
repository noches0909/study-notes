#!/usr/bin/env node
// shebang：直接执行 CLI 时由操作系统使用 Node.js 运行此文件。
import { readFile } from "node:fs/promises"
import { program } from "commander"
import inquirer from "inquirer"

const packageJson = JSON.parse(
  await readFile(new URL("./package.json", import.meta.url), "utf8"),
)

program
  .name("test-cli")
  .description("一个最小的 Node.js CLI 示例")
  .version(packageJson.version)

program
  .command("create <project-name>")
  .alias("c")
  .description("创建一个项目（演示，不会真正写入文件）")
  .action(async (projectName) => {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "description",
        message: "请输入项目描述：",
      },
    ])

    console.log("项目名称：", projectName)
    console.log("项目描述：", answers.description)
  })

await program.parseAsync()
