var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>项目只装了 <code>express</code>，代码里却能直接 <code>require(&#x27;debug&#x27;)</code>，而 <code>package.json</code> 里根本没写 <code>debug</code>。这是因为 <code>debug</code> 是 <code>express</code> 的依赖，npm 把它提升到了 <code>node_modules</code> 根目录，Node.js 查找时顺着找到了它。这种没声明却能用的依赖就叫幽灵依赖，哪天 <code>express</code> 不再依赖 <code>debug</code>，代码就跑不起来了。</p>
<p>npm 从 v3 起默认把依赖尽量提升到顶层，Yarn Classic 也是这样，好处是减少重复安装，代价就是幽灵依赖。pnpm 换了一种结构：所有包的文件存在一个按内容寻址的全局仓库里，装进项目时用硬链接，不额外占磁盘；<code>node_modules</code> 根目录只放直接依赖的符号链接，真实文件在 <code>node_modules/.pnpm</code> 里，每个包只能找到自己声明过的依赖。</p>
<p>Yarn 2 以后的版本，也就是 Yarn Berry，默认用 Plug&#x27;n&#x27;Play，不生成 <code>node_modules</code>，而是生成一个 <code>.pnp.cjs</code> 文件，告诉 Node.js 每个包在磁盘上的位置，同样能拦住幽灵依赖。</p>
<p>要注意，pnpm 的符号链接结构偶尔会和不支持符号链接的工具冲突，这时可以把 <code>nodeLinker</code> 设成 <code>hoisted</code>，生成和 npm 类似的扁平结构，但也就失去了严格性。</p>
</blockquote>
<h2>扁平的 node_modules 是怎么来的</h2>
<p>Node.js 解析 <code>require(&#x27;debug&#x27;)</code> 时，会从当前文件所在目录开始，逐级往上找 <code>node_modules/debug</code>。所以只要某个包被放在项目根目录的 <code>node_modules</code> 里，项目里任何文件都能找到它。</p>
<p>npm 文档描述了它的做法：为了减少重复，npm 从 v3 起默认把依赖安装到尽可能高的层级，这叫提升（hoisting）。假设项目依赖 A，A 依赖 B，提升以后目录是这样的：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">node_modules
├── A
└── B   ← 被提升到根目录
</code></pre></div>
<p>项目自己没声明 B，可是 B 就在根目录下，<code>require(&#x27;B&#x27;)</code> 能成功。pnpm 文档也指出，npm 和 Yarn Classic 把包提升到根目录，结果是源码能访问到没有声明为依赖的包。</p>
<p>问题出在这种“能用”不受控制。B 的版本由 A 决定，A 升级后换了 B 的版本或者不再依赖 B，项目代码就会在没改任何东西的情况下出错。另一种情况是，同一个包的两个版本只能有一个被提升，其他版本嵌套在各自依赖方的目录里，于是安装顺序不同，最终谁在根目录也可能不同。</p>
<h2>pnpm 的目录长什么样</h2>
<p>pnpm 文档用 <code>foo@1.0.0</code> 依赖 <code>bar@1.0.0</code> 作例子。装完后的结构大致是：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">node_modules
├── foo -&gt; ./.pnpm/foo@1.0.0/node_modules/foo
└── .pnpm
    ├── bar@1.0.0
    │   └── node_modules
    │       └── bar        （文件硬链接到全局仓库）
    └── foo@1.0.0
        └── node_modules
            ├── foo        （文件硬链接到全局仓库）
            └── bar -&gt; ../../bar@1.0.0/node_modules/bar
</code></pre></div>
<p>先看根目录：只有项目直接依赖的 <code>foo</code>，而且它只是一个指向 <code>.pnpm</code> 里真实位置的符号链接。项目代码 <code>require(&#x27;bar&#x27;)</code> 会失败，因为根目录下没有 <code>bar</code>，幽灵依赖在这里就暴露出来了。</p>
<p>那 <code>foo</code> 自己怎么找到 <code>bar</code>？Node.js 解析模块时会把符号链接换成真实路径，所以 <code>foo</code> 的代码实际位于 <code>.pnpm/foo@1.0.0/node_modules/foo</code>。从这里往上一级，就是 <code>.pnpm/foo@1.0.0/node_modules</code>，里面恰好放着 <code>bar</code> 的符号链接。pnpm 文档称这种结构和 Node.js 的模块解析算法完全兼容，而且依赖图再深，目录深度也不变。</p>
<p>文件本身从哪来？pnpm 维护一个内容寻址的全局仓库，也就是按文件内容来存储，同样内容的文件只存一份。<code>.pnpm</code> 里每个包的文件都是指向仓库的硬链接，文件系统不支持时会改用写时复制，两者都不支持才真正复制。所以 100 个项目用同一版本的依赖，磁盘上也只有一份；新版本只改了一个文件，仓库里也只新增这一个文件。</p>
<p>不过 pnpm 并不是一个包都不提升。生态里有不少包没在 <code>package.json</code> 里写全自己的依赖，为了减少报错，pnpm 默认把所有依赖提升到 <code>node_modules/.pnpm/node_modules</code>。这个位置只有 <code>.pnpm</code> 里的包往上查找时能找到，项目自己的代码找不到，可以用 <code>hoist: false</code> 关掉。</p>
<h2>Yarn Plug&#x27;n&#x27;Play 是另一种思路</h2>
<p>Yarn Berry 的 <code>nodeLinker</code> 设置有三个值：默认的 <code>pnp</code> 只生成一个 Node.js 加载文件；<code>pnpm</code> 用符号链接和硬链接到全局内容寻址仓库，和 pnpm 类似；<code>node-modules</code> 生成和 Yarn Classic、npm 一样的常规目录。</p>
<p>PnP 模式下项目里没有 <code>node_modules</code>，<code>.pnp.cjs</code> 记录了整棵依赖树和每个包在磁盘上的位置，由它来处理 <code>require</code> 和 <code>import</code> 的解析。Yarn 文档把幽灵依赖保护列为 PnP 的特点之一：包没声明的依赖，解析时就会报错。代价是有些工具默认直接读 <code>node_modules</code>，需要额外适配。</p>
<h2>常见追问</h2>
<p><strong>怎样修复项目里的幽灵依赖？</strong></p>
<blockquote>
<p>把代码里直接用到的包都写进自己的 <code>package.json</code>。切换到 pnpm 往往是发现它们最快的办法，因为没声明的包会直接报找不到模块。如果是第三方包漏写了依赖，pnpm 可以用 <code>packageExtensions</code> 给它补上，Yarn 也有同名的设置。</p>
</blockquote>
<p><strong>pnpm 用硬链接，改了 node_modules 里的文件会怎样？</strong></p>
<blockquote>
<p>硬链接指向的是同一份文件内容，所以直接改 <code>node_modules</code> 里依赖的文件，会影响全局仓库里的那份，进而影响其他用到它的项目。需要改依赖源码时应该用 <code>pnpm patch</code> 这类打补丁的方式。</p>
</blockquote>
<p><strong>lockfile 各家通用吗？</strong></p>
<blockquote>
<p>不通用。npm 用 <code>package-lock.json</code>，Yarn 用 <code>yarn.lock</code>，pnpm 用 <code>pnpm-lock.yaml</code>，一个项目应该只用一种包管理器并提交对应的锁文件。锁文件的作用见<a href="/questions/engineering-lockfile/">《为什么需要提交 lockfile？npm ci 和 npm install 有何区别？》</a>，多包仓库的管理见<a href="/questions/engineering-pnpm-workspaces/">《pnpm workspace 怎样管理多包前端仓库？》</a>。</p>
</blockquote>`};export{e as default};