var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如团队要新做一个后台管理系统，从 0 搭建不只是跑一下 <code>npm create vite@latest</code>，而是要让以后每个人拉下代码都能用同样的方式开发、检查、构建和发布。</p>
<p>我一般按这个顺序做。先确定技术栈和约束，比如框架、要支持的浏览器、是否需要 SSR。然后用官方脚手架创建项目，在 <code>package.json</code> 里固定 Node 版本和包管理器，提交 lockfile。接着配代码规范：TypeScript 严格模式、ESLint、Prettier、EditorConfig，再用 Git 钩子在提交前检查改动的文件。</p>
<p>之后是项目内部的约定：目录结构、路由、状态管理、接口请求层、环境变量。最后把质量和交付接上：CI 跑类型检查、lint、测试和构建，部署流程，以及错误监控和 Source Map。</p>
<p>要注意，规范要靠工具自动执行，只写在文档里的约定很快就没人遵守。也不要一开始就堆满所有工具，先把“能复现、能检查、能发布”这条主线打通，其他按需要再加。</p>
</blockquote>
<h2>先确定约束，再选工具</h2>
<p>动手前先问清楚几件事：页面主要是后台还是面向用户、要支持哪些浏览器、需不需要 SEO 和服务端渲染、团队熟悉什么框架。这些决定了用纯客户端的 Vite 项目，还是 Next.js、Nuxt 这类框架。选型的回答思路可以看<a href="/questions/project-tech-selection/">《面试官问“为什么选这个技术栈”，应该怎样回答技术选型？》</a>。</p>
<p>为什么要先定约束？因为浏览器范围会影响编译目标和 polyfill，要不要 SSR 会影响路由、数据获取和部署方式，这些后面再改代价很大。浏览器范围的配置见<a href="/questions/eng-browser-targets/">《browserslist、编译目标和 polyfill 注入分别怎样配置？》</a>。</p>
<h2>让每个人的环境一致</h2>
<p>用官方脚手架创建项目，比如 <code>npm create vite@latest</code>，选好框架模板。Vite 文档写明当前版本要求 Node.js 20.19+ 或 22.12+，所以要在 <code>package.json</code> 的 <code>engines</code> 里写上 Node 版本，也可以加一个 <code>.nvmrc</code> 之类的文件让版本管理工具读取。</p>
<p>包管理器同样要固定。<code>package.json</code> 的 <code>packageManager</code> 字段写明用哪个包管理器和版本，配合 Corepack，团队里每个人用的就是同一个版本，详见<a href="/questions/engineering-corepack/">《Corepack 和 packageManager 字段怎样固定包管理器？》</a>。lockfile 要提交，CI 里用 <code>npm ci</code> 这类命令严格按锁文件安装，原因见<a href="/questions/engineering-lockfile/">《为什么需要提交 lockfile？npm ci 和 npm install 有何区别？》</a>。</p>
<h2>把代码规范交给工具</h2>
<p>TypeScript 打开 <code>strict</code>。要注意 Vite 只转译 TypeScript，不做类型检查，文档建议另外运行 <code>tsc --noEmit</code>，所以要把它加进 <code>npm run</code> 脚本和 CI，不然类型错误也能顺利打包上线。具体选项见<a href="/questions/ts-tsconfig/">《strict、noUncheckedIndexedAccess 和 target 如何配置？》</a>。</p>
<p>ESLint 负责找出可能的 bug 和不推荐的写法，Prettier 负责统一格式，EditorConfig 让不同编辑器的缩进、换行符保持一致。再用 husky 加 lint-staged，在提交前只检查改动的文件。它们怎样配合见<a href="/questions/eng-code-quality-tooling/">《ESLint、Prettier、husky 和 lint-staged 分别做什么？怎样配合？》</a>。</p>
<p>提交信息可以约定成 Conventional Commits 格式，比如 <code>feat: 新增导出按钮</code>、<code>fix: 修复分页错位</code>，方便以后生成变更日志。</p>
<h2>约定项目内部的结构</h2>
<p>目录可以按功能组织，比如 <code>src/features/order</code> 下放订单相关的页面、组件和接口，公共组件放 <code>src/components</code>，工具函数放 <code>src/utils</code>。为什么按功能而不是按文件类型？因为改一个需求时，相关文件都在一个目录里，删除功能时也能整块删掉。</p>
<p>接口请求要封装成统一的一层，在这里处理基础地址、登录态、错误提示和超时，页面里不直接写 <code>fetch</code>。环境变量用 <code>.env</code> 文件区分开发、测试、生产，要注意 Vite 只把 <code>VITE_</code> 开头的变量暴露给前端代码，而且这些值会被打包进产物，所以不能放密钥，见<a href="/questions/eng-env/">《为什么前端环境变量不能存放秘密？》</a>。</p>
<h2>接上质量检查和交付</h2>
<p>CI 在每次提交或合并请求时跑类型检查、lint、单元测试和构建，任何一步失败都不能合并。仓库可以开启分支保护，要求检查通过、评审通过才能合入；GitHub 的 <code>CODEOWNERS</code> 文件可以给不同目录指定负责人，合并请求修改了对应目录就自动请他评审。流水线怎样设计见<a href="/questions/git-cicd-pipeline/">《前端 CI/CD 流水线怎样设计？》</a>。</p>
<p>上线前还要准备两件事：错误监控，用来发现线上报错和白屏；Source Map 上传到监控平台而不是公开部署，用来把压缩后的报错还原到源码位置。</p>
<p>最后写一份 README，说明怎样安装、启动、测试、构建和发布。检验标准是新人照着文档，几条命令就能把项目跑起来。</p>
<h2>常见追问</h2>
<p><strong>项目刚开始，有必要一次把这些都配上吗？</strong></p>
<blockquote>
<p>不必。环境一致、类型检查、lint 和 CI 构建这几项成本低、收益大，最好一开始就有，因为越晚加，要修的历史问题越多。端到端测试、性能预算、复杂的发布流程，可以等业务稳定、确实需要时再补。</p>
</blockquote>
<p><strong>如果是接手一个没有规范的老项目，怎么推进？</strong></p>
<blockquote>
<p>不要一次性全量格式化、把所有规则设成报错，那样会产生巨大的改动，和别人的分支冲突。可以先让 CI 跑通构建和类型检查，lint 规则先设成警告，只对新改动的文件强制执行，再分批清理旧代码。</p>
</blockquote>`};export{e as default};