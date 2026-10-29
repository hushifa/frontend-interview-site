var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>团队里有人提交了一段声明了却没用的变量，有人缩进用两个空格、有人用四个，代码评审时大家都在争格式。这四个工具就是用来把这些事交给机器的。</p>
<p>ESLint 和 Prettier 分工不同。ESLint 是 linter，按一条条规则检查代码，比如 <code>no-unused-vars</code> 找出没用到的变量，能发现真正的 bug，部分规则还能用 <code>--fix</code> 自动修。Prettier 是格式化工具，它不按规则挑错，而是把整段代码按统一风格重新打印一遍。Prettier 官方的说法是：格式交给 Prettier，抓 bug 交给 linter。</p>
<p>husky 和 lint-staged 负责“什么时候跑”。husky 用来配置 Git 钩子，比如在 <code>git commit</code> 之前执行一段命令。lint-staged 只拿暂存区里的文件去跑命令，不会把整个仓库检查一遍，所以提交前的检查很快。常见组合是 husky 的 <code>pre-commit</code> 钩子执行 <code>npx lint-staged</code>，lint-staged 再对改动的 JS 文件依次跑 <code>eslint --fix</code> 和 <code>prettier --write</code>。</p>
<p>要注意，ESLint 里有些格式类规则会和 Prettier 冲突，可以用 <code>eslint-config-prettier</code> 关掉它们。另外 Git 钩子可以被跳过，所以 CI 里还要再跑一次检查。</p>
</blockquote>
<h2>ESLint 和 Prettier 为什么要一起用</h2>
<p>Prettier 文档把 linter 的规则分成两类。一类是格式规则，比如 <code>max-len</code>、<code>keyword-spacing</code>，管的是空格、换行、逗号放哪。另一类是代码质量规则，比如 <code>no-unused-vars</code>、<code>prefer-promise-reject-errors</code>，管的是代码有没有问题。</p>
<p>Prettier 只负责第一类，而且做法和 linter 不一样：它没有可以单独开关的格式规则，而是把整个程序从头重新打印一遍，所以格式不可能写错。第二类它完全不管，这一类恰恰是 linter 最重要的部分，因为能抓到真正的 bug。</p>
<p>ESLint 文档对自己的定义是一个可配置的 JavaScript linter，帮你发现并修复代码里的问题。规则是它的核心，每条规则检查代码是否满足某个预期；有的规则能提供自动修复，用 <code>--fix</code> 命令行参数或者编辑器插件就能应用，修复不会改变代码逻辑。插件可以带来更多规则，比如针对 TypeScript 或 React 的规则。</p>
<p>两个工具都管格式时就会打架：ESLint 的某条格式规则要求这样写，Prettier 重新打印成了另一种样子。Prettier 文档的建议是用 <code>eslint-config-prettier</code> 关掉和 Prettier 冲突或者多余的规则。它也提到可以用 <code>eslint-plugin-prettier</code> 把 Prettier 当成一条 ESLint 规则来跑，但一般不推荐，因为编辑器里会满屏红线，速度也比直接跑 Prettier 慢。</p>
<h2>提交前自动检查是怎么串起来的</h2>
<p>lint-staged 的 README 给出的推荐安装步骤是三步：安装 lint-staged；配置一个 <code>pre-commit</code> Git 钩子去运行它，README 推荐 husky；再配置要对哪些文件跑哪些命令。</p>
<p>husky 这一步用 <code>npx husky init</code> 完成。husky 文档说明，这条命令会在 <code>.husky/</code> 目录下创建一个 <code>pre-commit</code> 脚本，并更新 <code>package.json</code> 里的 <code>prepare</code> 脚本。把脚本内容改成运行 lint-staged：</p>
<div class="not-prose code-block"><div class="code-language">shell</div><pre><code class="hljs language-shell"># .husky/pre-commit
npx lint-staged
</code></pre></div>
<p>然后在 <code>package.json</code> 里配置 lint-staged，键是文件匹配规则，值是要运行的命令：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;lint-staged&quot;: {
    &quot;*.{js,jsx}&quot;: [&quot;eslint --fix&quot;, &quot;prettier --write&quot;],
    &quot;!(*.js|*.jsx)&quot;: &quot;prettier --write&quot;
  }
}
</code></pre></div>
<p>为什么命令后面不写文件路径？因为 lint-staged 会把匹配到的暂存文件作为参数追加到命令后面，README 特意提醒不要自己传路径。命令改过的文件，默认会自动加回暂存区，一起提交。</p>
<p>为什么 JS 文件要写成数组，而不是写两条 <code>&quot;*&quot;: &quot;prettier --write&quot;</code> 和 <code>&quot;*.js&quot;: &quot;eslint --fix&quot;</code>？README 解释，lint-staged 默认并行执行不同匹配规则的任务，两条规则都匹配到同一个文件时，<code>prettier</code> 和 <code>eslint</code> 可能同时改写它，出现竞争。写成数组的命令按顺序执行，再用取反的匹配规则让其他文件只跑 Prettier，就不会重叠。</p>
<h2>检查失败时会发生什么</h2>
<p>ESLint 报出无法自动修复的错误时，命令以非零状态退出，lint-staged 也就失败，提交被中止。lint-staged 默认在运行任务前会先创建一个 <code>git stash</code> 作为备份，防止改动丢失。</p>
<p>但钩子不是强制的。<code>git commit --no-verify</code> 可以跳过本地钩子，husky 也可以用 <code>HUSKY=0</code> 关闭，所以提交前检查只是让问题尽早暴露，CI 里仍然要运行 <code>eslint .</code> 和 <code>prettier --check .</code> 作为最后一道关。</p>
<h2>常见追问</h2>
<p><strong>为什么不在 pre-commit 里直接跑 <code>eslint .</code>？</strong></p>
<blockquote>
<p>可以，但仓库大了以后每次提交都要检查所有文件，会很慢，而且会被别人留下的旧问题卡住。lint-staged 只检查这次提交改到的文件，速度快，也只要求你为自己的改动负责。</p>
</blockquote>
<p><strong><code>prepare</code> 脚本有什么用？</strong></p>
<blockquote>
<p>npm 文档说明，在项目里执行不带包名的 <code>npm install</code> 时会运行 <code>prepare</code> 脚本。husky 把自己的安装命令写在这里，团队成员拉下代码、装完依赖，Git 钩子就自动配好了，不用每人手动设置。</p>
</blockquote>
<p><strong>ESLint 的配置文件应该怎么写？</strong></p>
<blockquote>
<p>现在的 ESLint 使用 Flat Config，也就是 <code>eslint.config.js</code> 导出的配置数组，具体写法见<a href="/questions/engineering-eslint-flat-config/">《ESLint Flat Config 和旧配置方式有什么区别？》</a>。</p>
</blockquote>`};export{e as default};