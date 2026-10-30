var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如团队想要一个 <code>create-admin</code> 命令，运行 <code>npm create admin my-app</code> 就生成一个配好规范的新项目。这就是一个 Node.js 命令行工具，本质上是一个能在终端里直接当命令运行的 JS 文件。</p>
<p>让 JS 文件变成命令要两步。一是在 <code>package.json</code> 里写 <code>bin</code> 字段，把命令名映射到入口文件，npm 安装时会把它链接到可执行目录，Windows 上则生成一个 <code>.cmd</code> 文件。二是入口文件第一行写 <code>#!/usr/bin/env node</code>，npm 文档特别提醒，不写这一行脚本就不会用 node 来执行。</p>
<p>入口里先解析参数。<code>process.argv</code> 前两项是 node 的路径和脚本路径，后面才是用户输入的参数。手动解析很容易漏情况，Node.js 自带的 <code>util.parseArgs</code> 从 v20 起是稳定 API，支持长短选项、默认值，遇到未知选项会直接报错。参数没给全时，再用 <code>readline</code> 在终端里提问。最后把模板目录复制到目标位置，替换里面的项目名等占位符。</p>
<p>发布以后，用户不用全局安装，<code>npx 包名</code> 就能运行，npm 会把包下载到缓存里执行。包名叫 <code>create-xxx</code> 时，<code>npm create xxx</code> 会被转成 <code>npm exec create-xxx</code>。要注意，传给脚手架的参数要写在 <code>--</code> 后面，前面的参数会被 npm 自己吃掉。</p>
</blockquote>
<h2>一个最小的命令长什么样</h2>
<p>先看 <code>package.json</code>。<code>bin</code> 是一个对象，键是命令名，值是入口文件：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;name&quot;: &quot;create-admin&quot;,
  &quot;version&quot;: &quot;1.0.0&quot;,
  &quot;type&quot;: &quot;module&quot;,
  &quot;bin&quot;: {
    &quot;create-admin&quot;: &quot;./bin/cli.js&quot;
  },
  &quot;files&quot;: [&quot;bin&quot;, &quot;templates&quot;]
}
</code></pre></div>
<p>只有一个命令、而且命令名和包名相同时，<code>bin</code> 可以直接写成字符串 <code>&quot;./bin/cli.js&quot;</code>，npm 文档说明这两种写法等价。<code>files</code> 决定发布时带上哪些文件，模板目录别忘了写进去。</p>
<p>入口文件第一行是 shebang：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-meta">#!/usr/bin/env node</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;hello&#x27;</span>);
</code></pre></div>
<p>为什么要写这一行？在 macOS 和 Linux 上，npm 会给 <code>bin</code> 里的文件建一个符号链接，终端执行这个文件时，看第一行才知道该用哪个程序来跑它。<code>/usr/bin/env node</code> 的意思是在 <code>PATH</code> 里找 <code>node</code>，这样不用写死 node 的安装路径。Windows 不认 shebang，npm 会生成一个 <code>.cmd</code> 包装文件来调用 node，所以同一个包在两个系统上都能用。</p>
<p>开发时不用每次发布再测，在包目录里运行 <code>npm link</code>，就会把命令链接到全局，改了代码直接生效。</p>
<h2>怎样解析命令行参数</h2>
<p><code>process.argv</code> 是一个字符串数组。按 Node.js 文档，第一项是 node 可执行文件的路径，第二项是脚本的绝对路径，后面才是用户输入的参数。所以运行 <code>create-admin my-app --template react -f</code> 时，真正的参数是 <code>process.argv.slice(2)</code>。</p>
<p>参数格式很多，<code>--template react</code>、<code>--template=react</code>、<code>-t react</code>、<code>-f</code> 都要支持，自己写很容易漏。<code>util.parseArgs</code> 能处理这些情况：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { parseArgs } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:util&#x27;</span>;

<span class="hljs-keyword">const</span> { values, positionals } = <span class="hljs-title function_">parseArgs</span>({
  <span class="hljs-attr">options</span>: {
    <span class="hljs-attr">template</span>: { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;string&#x27;</span>, <span class="hljs-attr">short</span>: <span class="hljs-string">&#x27;t&#x27;</span>, <span class="hljs-attr">default</span>: <span class="hljs-string">&#x27;vanilla&#x27;</span> },
    <span class="hljs-attr">force</span>: { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;boolean&#x27;</span>, <span class="hljs-attr">short</span>: <span class="hljs-string">&#x27;f&#x27;</span> },
    <span class="hljs-attr">help</span>: { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;boolean&#x27;</span>, <span class="hljs-attr">short</span>: <span class="hljs-string">&#x27;h&#x27;</span> },
  },
  <span class="hljs-attr">allowPositionals</span>: <span class="hljs-literal">true</span>,
});
<span class="hljs-comment">// 运行 create-admin my-app --template react -f 时：</span>
<span class="hljs-comment">// values 是 { template: &#x27;react&#x27;, force: true }，positionals 是 [&#x27;my-app&#x27;]</span>
</code></pre></div>
<p>不传 <code>args</code> 时，<code>parseArgs</code> 默认就解析 <code>process.argv</code> 去掉前两项后的部分。<code>allowPositionals</code> 要显式打开，因为严格模式下它默认是 <code>false</code>，项目名这种不带 <code>--</code> 的参数会直接报错。</p>
<p>严格模式默认是开的，用户输错选项名，比如 <code>--templete</code>，<code>parseArgs</code> 会抛出 <code>ERR_PARSE_ARGS_UNKNOWN_OPTION</code> 错误。这比悄悄忽略好，用户能马上知道自己写错了。CLI 里可以捕获这个错误，打印帮助信息，再把 <code>process.exitCode</code> 设成非 0，让调用它的脚本知道执行失败了。</p>
<p><code>parseArgs</code> 在 v18.3.0 加入，v20.0.0 起不再是实验性 API。要兼容更老的 Node.js，或者需要子命令、自动生成帮助信息，再考虑 <code>commander</code> 这类第三方库。</p>
<h2>参数不够时怎样交互提问</h2>
<p>用户只输入 <code>npm create admin</code>，什么参数都没给，就要在终端里一项项问。Node.js 自带的 <code>readline/promises</code> 可以做到：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> * <span class="hljs-keyword">as</span> readline <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:readline/promises&#x27;</span>;
<span class="hljs-keyword">import</span> { stdin <span class="hljs-keyword">as</span> input, stdout <span class="hljs-keyword">as</span> output } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:process&#x27;</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">ask</span>(<span class="hljs-params">question, fallback</span>) {
  <span class="hljs-comment">// 非终端环境（比如 CI 或管道）不能等用户输入，直接用默认值。</span>
  <span class="hljs-keyword">if</span> (!input.<span class="hljs-property">isTTY</span>) <span class="hljs-keyword">return</span> fallback;
  <span class="hljs-keyword">const</span> rl = readline.<span class="hljs-title function_">createInterface</span>({ input, output });
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> answer = <span class="hljs-keyword">await</span> rl.<span class="hljs-title function_">question</span>(<span class="hljs-string">\`<span class="hljs-subst">\${question}</span>（默认 <span class="hljs-subst">\${fallback}</span>）：\`</span>);
    <span class="hljs-keyword">return</span> answer.<span class="hljs-title function_">trim</span>() || fallback;
  } <span class="hljs-keyword">finally</span> {
    rl.<span class="hljs-title function_">close</span>();
  }
}

<span class="hljs-keyword">const</span> projectName = positionals[<span class="hljs-number">0</span>] ?? (<span class="hljs-keyword">await</span> <span class="hljs-title function_">ask</span>(<span class="hljs-string">&#x27;项目名称&#x27;</span>, <span class="hljs-string">&#x27;my-app&#x27;</span>));
</code></pre></div>
<p>为什么要判断 <code>isTTY</code>？在 CI 里或者被别的脚本调用时，没有人能回答问题，程序会一直卡住。Node.js 文档说，标准输入连着终端时 <code>process.stdin</code> 是 <code>tty.ReadStream</code>，<code>isTTY</code> 为 <code>true</code>；不是终端时它就不是 <code>true</code>。所以非终端环境下直接用默认值或者报错退出。需要选择框、多选这类交互时，可以用 <code>@inquirer/prompts</code>、<code>prompts</code> 等库。</p>
<h2>怎样根据模板生成项目</h2>
<p>模板通常是一个普通目录，放在包里一起发布。生成项目就是两步：把模板目录复制到用户指定的位置，再把文件里的占位符换成真实的值。</p>
<p>复制目录可以用 <code>fs/promises</code> 的 <code>cp</code>，它在 Node.js v22.3.0 起是稳定 API：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { cp, readFile, writeFile } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:fs/promises&#x27;</span>;
<span class="hljs-keyword">import</span> { fileURLToPath } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:url&#x27;</span>;
<span class="hljs-keyword">import</span> path <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:path&#x27;</span>;

<span class="hljs-keyword">const</span> templateDir = <span class="hljs-title function_">fileURLToPath</span>(<span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(<span class="hljs-string">\`../templates/<span class="hljs-subst">\${values.template}</span>\`</span>, <span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">url</span>));
<span class="hljs-keyword">const</span> targetDir = path.<span class="hljs-title function_">resolve</span>(process.<span class="hljs-title function_">cwd</span>(), projectName);

<span class="hljs-comment">// force: false 加 errorOnExist: true，目标已存在时报错，而不是覆盖用户的文件。</span>
<span class="hljs-keyword">await</span> <span class="hljs-title function_">cp</span>(templateDir, targetDir, { <span class="hljs-attr">recursive</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">force</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">errorOnExist</span>: <span class="hljs-literal">true</span> });

<span class="hljs-keyword">const</span> pkgPath = path.<span class="hljs-title function_">join</span>(targetDir, <span class="hljs-string">&#x27;package.json&#x27;</span>);
<span class="hljs-keyword">const</span> pkg = <span class="hljs-keyword">await</span> <span class="hljs-title function_">readFile</span>(pkgPath, <span class="hljs-string">&#x27;utf8&#x27;</span>);
<span class="hljs-keyword">await</span> <span class="hljs-title function_">writeFile</span>(pkgPath, pkg.<span class="hljs-title function_">replaceAll</span>(<span class="hljs-string">&#x27;{{name}}&#x27;</span>, projectName));
</code></pre></div>
<p>模板路径为什么用 <code>import.meta.url</code> 算？因为用户在任意目录运行命令，<code>process.cwd()</code> 是用户当前所在的目录，不是脚手架包的安装位置。模板跟着包走，要从入口文件自己的位置去找。目标目录才用 <code>process.cwd()</code>。</p>
<p>占位符替换值得单独写成函数，并先校验项目名。项目名会被写进 <code>package.json</code>，也会作为目录名，所以要限制字符：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">isValidName</span>(<span class="hljs-params">name</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-regexp">/^[a-z0-9][a-z0-9._-]*$/</span>.<span class="hljs-title function_">test</span>(name);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">render</span>(<span class="hljs-params">template, data</span>) {
  <span class="hljs-keyword">return</span> template.<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/\\{\\{(\\w+)\\}\\}/g</span>, <span class="hljs-function">(<span class="hljs-params">match, key</span>) =&gt;</span> (key <span class="hljs-keyword">in</span> data ? data[key] : match));
}

<span class="hljs-keyword">const</span> template = <span class="hljs-string">&#x27;{&quot;name&quot;:&quot;{{name}}&quot;,&quot;description&quot;:&quot;{{desc}}&quot;}&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(<span class="hljs-title function_">isValidName</span>(<span class="hljs-string">&#x27;my-app&#x27;</span>))); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(<span class="hljs-title function_">isValidName</span>(<span class="hljs-string">&#x27;My App&#x27;</span>))); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">render</span>(template, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;my-app&#x27;</span> })); <span class="hljs-comment">// {&quot;name&quot;:&quot;my-app&quot;,&quot;description&quot;:&quot;{{desc}}&quot;}</span>
</code></pre></div>
<p>第二行为什么是 <code>false</code>？npm 文档规定新包的名字不能有大写字母，也不能有 URL 里不安全的字符，空格就是其中一种。项目名会直接变成 <code>package.json</code> 的 <code>name</code>，所以生成之前就要挡住。</p>
<p>第三行里没传 <code>desc</code>，占位符原样保留，而不是变成 <code>undefined</code>。这样生成出来的文件一眼能看出哪里没替换，比悄悄写进一个 <code>undefined</code> 好排查。</p>
<h2>npx 和 npm create 是怎么找到命令的</h2>
<p>用户运行 <code>npx create-admin</code> 时，按 npm 文档，如果当前项目的依赖里没有这个包，npm 会先提示是否安装；它装到 npm 缓存的一个目录里，不会写进当前项目。在 CI 这种非终端环境，npm 会默认同意安装。</p>
<p>一个包可能有多个命令，npm 要决定执行哪一个：<code>bin</code> 里只有一项时就用它；有多项时，用和包名（去掉作用域）同名的那一项；都对不上就报错。所以脚手架通常让主命令和包名一致。</p>
<p><code>npm create</code> 是 <code>npm init</code> 的别名，它按约定把参数转换成包名：<code>npm init foo</code> 等于 <code>npm exec create-foo</code>，<code>npm init @usr/foo</code> 等于 <code>npm exec @usr/create-foo</code>。所以 <code>create-vite</code>、<code>create-vue</code> 这些包，用户可以写成 <code>npm create vite</code>。</p>
<h2>常见追问</h2>
<p><strong>为什么 <code>npm create vite my-app --template react</code> 有时候模板参数不生效？</strong></p>
<blockquote>
<p>按 npm 文档，<code>npm init foo -- --hello</code> 才会变成 <code>npm exec -- create-foo --hello</code>，<code>--</code> 前面的选项是给 npm 自己的，后面的才原样传给脚手架。所以要可靠地传选项，写成 <code>npm create vite my-app -- --template react</code>。</p>
</blockquote>
<p><strong>脚手架用 ESM 还是 CommonJS 写？</strong></p>
<blockquote>
<p>新写的工具一般用 ESM，在 <code>package.json</code> 里写 <code>&quot;type&quot;: &quot;module&quot;</code>，入口文件里就能用 <code>import</code> 和 <code>import.meta.url</code>。要注意 ESM 里没有 <code>__dirname</code>，找模板目录时要用 <code>import.meta.url</code> 配合 <code>fileURLToPath</code> 计算。</p>
</blockquote>
<p><strong>怎样让命令执行失败时 CI 能发现？</strong></p>
<blockquote>
<p>设置非 0 的退出码。Node.js 文档推荐设 <code>process.exitCode = 1</code> 让进程自然退出，而不是直接调用 <code>process.exit(1)</code>，因为强制退出可能把还没写完的输出截断。</p>
</blockquote>`};export{e as default};