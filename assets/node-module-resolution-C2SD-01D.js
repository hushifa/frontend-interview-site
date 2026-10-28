var e={answerHtml:`<h2>简答</h2>
<ul>
<li>package.json 的 exports 定义包对外允许导入的路径，未列出的子路径会被拒绝。</li>
<li>条件导出按书写顺序匹配 import、require、node、default 等条件。</li>
<li>Node 原生 ESM 的相对导入必须写完整扩展名。</li>
<li>Node.js 22.12+ 与 20.19+ 默认允许 require 加载同步 ESM。</li>
</ul>
<p>没有 exports 时，消费者可能依赖包中某个内部文件，例如 <code>demo-kit/dist/internal.js</code>。作者一旦整理目录，这些导入就失效。exports 让包作者显式声明公开入口，并为不同使用条件选择实现，从而把“包里有哪些文件”和“哪些路径是公开 API”分开。</p>
<h2>入口名称由公开映射决定</h2>
<p>假设包的 package.json 为：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;name&quot;: &quot;demo-kit&quot;,
  &quot;type&quot;: &quot;module&quot;,
  &quot;main&quot;: &quot;./dist/index.cjs&quot;,
  &quot;exports&quot;: {
    &quot;.&quot;: {
      &quot;import&quot;: &quot;./dist/index.js&quot;,
      &quot;require&quot;: &quot;./dist/index.cjs&quot;,
      &quot;default&quot;: &quot;./dist/index.js&quot;
    },
    &quot;./format&quot;: &quot;./dist/format.js&quot;
  }
}
</code></pre></div>
<p><code>import &#x27;demo-kit&#x27;</code> 使用 import 分支；<code>require(&#x27;demo-kit&#x27;)</code> 使用 require 分支。<code>import &#x27;demo-kit/format&#x27;</code> 对应公开子路径，而不是要求包根目录真的存在 format 文件。</p>
<p>当 Node 支持 exports 且包配置了它时，包入口解析优先使用 exports，而不是 main。未导出的 <code>demo-kit/dist/internal.js</code> 即使真实存在，也会因为包子路径未导出而失败。</p>
<p>这不是文件系统权限隔离：拿到绝对路径并具备文件读取权限的代码仍可能访问文件。exports 是模块解析与 API 封装机制，不能用于保存秘密。</p>
<h2>条件按匹配与声明顺序选择</h2>
<p>import、require、node、default 等条件不是任意注释。解析器检查自己认可且当前匹配的条件，按对象键顺序寻找合适分支。default 总能匹配，通常放在最后；如果它放在更具体的条件前面，后面的分支可能没有机会被选中。</p>
<p>node 表示 Node 环境，import 与 require 表示加载方式，它们不是互斥的一组。需要同时区分环境和加载方式时可以嵌套条件，但应保持结构清楚，避免写出在某个环境永远到不了的分支。</p>
<p>构建工具可能认可 browser 等附加条件，Node 不会自动把所有工具自定义条件当作内置条件。某个包在 Vite 中工作，不证明同样的导入在 Node 直接执行时也会选中相同文件。</p>
<h2>exports 不改变文件本身的模块格式</h2>
<p>示例里的 type: module 让该包范围内的 .js 按 ESM 解释；.cjs 明确表示 CommonJS，.mjs 明确表示 ESM。把一个文件放进 require 条件，不会自动把文件内容转换成 CommonJS。</p>
<p>Node.js 22.12+ 与 20.19+ 默认允许 <code>require()</code> 同步加载 ESM；模块图中含顶层 await 时抛出 <code>ERR_REQUIRE_ASYNC_MODULE</code>，应改用 <code>import()</code>。运行时可用 <code>process.features.require_module</code> 检测，更早版本需要 <code>--experimental-require-module</code>。跨版本库应按目标版本测试，必要时提供真正的双格式产物。</p>
<p>双格式也会有副作用：import 和 require 若加载两份独立实现，模块级缓存、类身份和单例可能各有一套。设计库时要考虑消费者混用两种入口的情况，而不只是验证两边都不报语法错误。</p>
<h2>子路径与内部映射有不同用途</h2>
<p>exports 中的子路径模式可以公开一组文件，也可以用 null 排除不希望公开的部分。但模式是映射规则，不应凭“目录存在”就猜测所有深层路径都可用。公开路径是否包含扩展名，也应统一设计，避免为同一个接口制造多种不稳定写法。</p>
<p>package.json 的 imports 则提供包内部使用的映射，通常以 <code>#</code> 开头，例如 <code>#internal/logger</code>。它不是新增一组对外入口，也不能只配了 TypeScript paths 就期待 Node 自动按同样方式解析。</p>
<p>发布前应从一个独立消费项目测试：ESM 导入、CommonJS 加载、公开子路径、禁止路径和类型声明解析。内部源码相对导入成功，只证明源码之间能找到彼此，没有验证消费者看到的包契约。</p>`};export{e as default};