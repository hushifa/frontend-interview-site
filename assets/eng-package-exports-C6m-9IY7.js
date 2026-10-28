var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>exports</code> 定义包对外公开的入口，<code>imports</code> 定义包内部使用的私有映射。</li>
<li>在支持 <code>exports</code> 的 Node.js 中它优先于 <code>main</code>，没有列出的子路径不能再通过包名深层导入。</li>
<li>给已有包新增 <code>exports</code> 可能是破坏性变更，以前依赖的深层路径会被禁止。</li>
<li>条件入口（如 import、require、types）选择文件，<code>type</code> 决定 <code>.js</code> 文件按 ESM 还是 CJS 解释。</li>
</ul>
<p>一个包内部可能有很多文件，但消费者通常只应依赖少量稳定入口。exports 用来定义这份公开接口；imports 则为包内部引用建立映射，减少内部代码对复杂相对路径的依赖。</p>
<p>它们属于支持相应规则的模块解析器配置，不是运行时自动生成函数，也不是浏览器原生 ESM 会自行读取的通用目录配置。</p>
<h2>exports 控制从包名可以导入什么</h2>
<p>下面假设 dist 中已经生成相应文件：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;name&quot;: &quot;@demo/utils&quot;,
  &quot;version&quot;: &quot;1.0.0&quot;,
  &quot;type&quot;: &quot;module&quot;,
  &quot;main&quot;: &quot;./dist/index.cjs&quot;,
  &quot;exports&quot;: {
    &quot;.&quot;: {
      &quot;import&quot;: &quot;./dist/index.js&quot;,
      &quot;require&quot;: &quot;./dist/index.cjs&quot;
    },
    &quot;./format&quot;: &quot;./dist/format.js&quot;
  },
  &quot;imports&quot;: {
    &quot;#internal&quot;: &quot;./dist/internal.js&quot;
  }
}
</code></pre></div>
<p><code>.</code> 对应包根入口，消费者可以使用 @demo/utils；<code>./format</code> 对应 @demo/utils/format。消费者使用的是公开的子路径名称，不必知道真实文件位于 dist。</p>
<p>在支持 exports 的 Node.js 中，它优先于 main。没有列出的包子路径通常不能再通过包名深层导入，即使相应文件确实存在；例如 @demo/utils/dist/internal.js 不会因为在磁盘上就自动成为公开入口。</p>
<p>这也是给已有包新增 exports 可能构成破坏性变更的原因：以前用户依赖的深层路径，可能突然被禁止，包括未显式开放的 package.json 路径。</p>
<h2>条件入口选择文件，type 决定部分文件如何解释</h2>
<p>示例中通过 import 引用包根时选择 index.js，通过 require 时选择 index.cjs。type=module 使这个包作用域中的普通 .js 按 ESM 解释，.cjs 则明确表示 CommonJS。</p>
<p>import/require 是解析条件，不是给任意目标文件强制转换格式。较新的 Node 也能在特定条件下 require 某些 ESM，但需要满足相应版本和同步加载约束，不能反过来宣称所有 require 目标必须是 CJS，或所有 ESM 都能被同步加载。</p>
<p>双入口还要注意实现一致性。如果两个入口各自创建一份单例状态，同一进程混用时可能得到两份实例。提供两个路径，并不自动保证它们共享运行状态或具有完全相同的行为。</p>
<h2>条件对象的顺序会影响匹配</h2>
<p>node、import、require、default 等条件可能同时存在。解析器按规则与对象顺序选择匹配项，因此通常应把更具体的条件放前面，把 default 作为后备放后面。</p>
<p>不是“字段名字写对了就与排列无关”。不同工具也可能启用不同条件，例如类型检查器、浏览器打包器和 Node 的条件集合不完全相同。</p>
<p>添加 browser 或自定义条件时，应确认目标工具真的理解它。浏览器直接加载一个 ESM 文件，不会自行把 package.json 的 exports 当成所有裸导入的解析规则，通常仍需要打包器、开发服务器或 import map 等配合。</p>
<h2>imports 是包内部的映射</h2>
<p>imports 的键使用 # 前缀，例如示例中的 #internal。这个包里的模块可以通过该名称引用内部实现，而包外消费者不能因为安装了它，就把这个映射当成自己的全局别名。</p>
<p>与 exports 的目标规则不同，imports 还可以按相应规则映射外部包，便于内部选择依赖实现。它也可以使用条件映射，但条件顺序和环境支持同样需要验证。</p>
<p>它与 TypeScript paths 不是同一个配置：paths 主要告诉相应工具怎样理解导入，不保证运行时代码已经被改写。把类型解析通过和运行时解析成功分别验证，才能避免开发环境可用、发布后找不到模块。</p>
<h2>显式子路径与通配模式要谨慎选择</h2>
<p>少量稳定接口可以逐项列出。子路径模式适合较多结构化入口，但它不是把整个目录无条件公开的同义词，模式替换、扩展名和目标范围都有具体规则。</p>
<p>公开越多内部路径，以后重构时需要兼容的接口就越多。消费者也不应绕过公开入口依赖构建目录布局，再期待作者随时调整内部文件而不影响自己。</p>
<p>导出目标必须是合法路径，并满足相应包边界限制。不要靠随意拼接 ../ 把 exports 当作跳到包外任意位置的文件查找器。</p>
<h2>类型与实际归档也必须对应</h2>
<p>如果发布 TypeScript 类型声明，应为公开入口安排正确的类型解析，必要时使用适当的 types 条件或声明文件布局，并验证 import 与 require 消费者各自的结果。</p>
<p>exports 写了某个文件，不代表打包工具一定生成了它，也不代表 npm pack 一定把它放进归档。files、忽略规则、构建步骤和发布目录都可能让入口指向缺失产物。</p>
<p>验证时应从真正的发布包出发，测试根入口、子路径、类型声明和支持的模块环境，而不是只在源码仓库中通过相对路径导入一次。</p>
<h2>这是接口封装，不是保密机制</h2>
<p>exports 可以限制常规包子路径解析，却不是文件访问控制。已经交付到消费者机器上的文件，仍可能通过绝对路径或直接读取等方式取得。</p>
<p>因此不能把秘密放在包里，再靠“不导出这个文件”保护它。这里的价值是让依赖边界稳定、错误导入更早暴露，以及让作者能明确支持哪些接口。</p>`};export{e as default};