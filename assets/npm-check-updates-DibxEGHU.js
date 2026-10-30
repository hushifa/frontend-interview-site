var e={notesHtml:`<p>命令行工具 ncu，检查并把 package.json 中的依赖升级到最新版本，保留原有的 semver 范围写法（例如 ^18.3.1 改为 ^19.2.7），兼容 npm、yarn、pnpm、deno 和 bun。</p>
<p>它只修改 package.json，升级后还要自己运行 npm install 更新安装和锁文件。默认会忽略原有范围直接升到最新，包括大版本；用 ncu -i 交互模式可以逐个挑选。</p>
<p>许可：Apache-2.0。</p>`};export{e as default};