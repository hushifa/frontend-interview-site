var e={answerHtml:`<p>声明合并不是“后面的声明覆盖前面的声明”，而是 TypeScript 按规则把多份声明组合成同一个类型或实体的描述。它常用于接口扩展、库的模块增补，以及一些函数、类与命名空间组合模式。</p>
<p>需要先区分：某些声明只存在于类型层，另一些语法还会产生 JavaScript。不能把所有叫作“合并”的东西都归为完全没有运行时效果，也不能认为补了一份接口就已经给对象安装了方法。</p>
<h3>接口合并要求成员兼容</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">interface</span> <span class="hljs-title class_">PanelOptions</span> {
  <span class="hljs-attr">title</span>: <span class="hljs-built_in">string</span>;
}

<span class="hljs-keyword">interface</span> <span class="hljs-title class_">PanelOptions</span> {
  <span class="hljs-attr">width</span>: <span class="hljs-built_in">number</span>;
}

<span class="hljs-keyword">const</span> <span class="hljs-attr">panel</span>: <span class="hljs-title class_">PanelOptions</span> = { <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;阅读设置&#x27;</span>, <span class="hljs-attr">width</span>: <span class="hljs-number">320</span> };
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(panel.<span class="hljs-property">width</span>); <span class="hljs-comment">// 320</span>
</code></pre></div>
<p>这两份声明处在能够合并的同一声明空间中，最终接口同时需要 title 和 width。不同模块中碰巧同名的内部接口，不会自动越过模块边界合并。</p>
<p>同名普通属性通常要求一致的类型与修饰符，不是选择更晚出现的那一份：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">interface</span> <span class="hljs-title class_">Conflicting</span> {
  <span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span>;
}
<span class="hljs-keyword">interface</span> <span class="hljs-title class_">Conflicting</span> {
  <span class="hljs-comment">// @ts-expect-error 同名属性不能在另一份合并声明中改成 number</span>
  <span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span>;
}
</code></pre></div>
<p>方法成员可以按相应规则形成重载，但重载顺序与特化签名有自己的规则，也不是无限制地把所有声明随意拼起来。type 别名不能用重复声明的方式重新打开，类与类也不能直接按普通接口的方式合并。</p>
<h3>普通 namespace 可能有真实运行时代码</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">formatLabel</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span></span>): <span class="hljs-built_in">string</span> {
  <span class="hljs-keyword">return</span> value.<span class="hljs-title function_">trim</span>();
}

<span class="hljs-keyword">namespace</span> <span class="hljs-title class_">formatLabel</span> {
  <span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> version = <span class="hljs-string">&#x27;1.0&#x27;</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">formatLabel</span>(<span class="hljs-string">&#x27; Lin &#x27;</span>)); <span class="hljs-comment">// Lin</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(formatLabel.<span class="hljs-property">version</span>); <span class="hljs-comment">// 1.0</span>
</code></pre></div>
<p>命名空间放在相应函数声明之后，使这个函数还能具有导出的 version 成员。这里普通 namespace 中的值声明会产生运行时代码，真正给函数对象补上属性。</p>
<p>这与 <code>.d.ts</code> 中的 declare namespace 或接口合并不同：环境声明只描述某个值应当存在，不负责创建它。编写类型兼容说明时，应明确是在讨论哪一种语法。</p>
<p>命名空间中没有 export 的成员也不会因为同名合并，就自动对其他声明块可见。不要把合并理解成把源码块之间的全部局部变量无条件打通。</p>
<h3>模块增补需要类型声明和实现一起到位</h3>
<p>下面三个文件放在同一目录，使用 ESM。原模块提供 Counter，增补模块增加 reset 的类型与运行时实现，入口负责加载这个增补模块。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// counter.ts</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">Counter</span> {
  value = <span class="hljs-number">0</span>;
  <span class="hljs-title function_">increment</span>(): <span class="hljs-built_in">void</span> {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span> += <span class="hljs-number">1</span>;
  }
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// counter-augmentation.ts</span>
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Counter</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./counter.js&#x27;</span>;

<span class="hljs-keyword">declare</span> <span class="hljs-variable language_">module</span> <span class="hljs-string">&#x27;./counter.js&#x27;</span> {
  <span class="hljs-keyword">interface</span> <span class="hljs-title class_">Counter</span> {
    <span class="hljs-title function_">reset</span>(): <span class="hljs-built_in">void</span>;
  }
}

<span class="hljs-title class_">Counter</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">reset</span> = <span class="hljs-keyword">function</span> (<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span> = <span class="hljs-number">0</span>;
};
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// main.ts</span>
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Counter</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./counter.js&#x27;</span>;
<span class="hljs-keyword">import</span> <span class="hljs-string">&#x27;./counter-augmentation.js&#x27;</span>;

<span class="hljs-keyword">const</span> counter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Counter</span>();
counter.<span class="hljs-title function_">increment</span>();
counter.<span class="hljs-title function_">reset</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(counter.<span class="hljs-property">value</span>); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>declare module 中的接口合并让编译器知道 Counter 实例上存在 reset；原型赋值才实际安装方法；入口的副作用导入确保这段安装代码运行。</p>
<p>如果增补文件被 TypeScript 项目包含，但入口没有加载相应实现，类型检查仍可能知道 reset，运行时调用却会失败。反过来，只安装方法但没有合适声明，则运行时可能能用，编译器却无法按契约检查。</p>
<p>示例使用 .js 导入路径，让编译后的 ESM 仍指向真实 JavaScript 文件；TypeScript 会按配置解析对应的源文件。实际项目还需要让模块解析方式与目标宿主、构建工具一致。</p>
<h3>增补的是解析到的模块，不是任意同名字符串</h3>
<p>模块增补中的标识符按模块解析规则指向目标。它必须解析到你真正希望扩展的那个模块，而不是因为包名或文件名看起来相似，就能作用到所有引用。</p>
<p>增补文件也必须进入编译器项目。需要运行时补丁时，还要保证打包器与入口不会把必要的副作用导入遗漏或误删。类型可见与代码被执行是两份不同的检查。</p>
<p>一个 <code>.d.ts</code> 文件如果没有导入或导出标记，其中的 declare module 可能是在声明一个新的环境模块，而不是在已有模块上下文中增补。编写增补文件时应明确它是模块，可按需求使用顶层 import 或 export {}，避免无意遮住原库导出。</p>
<h3>默认导出、新顶层声明与全局扩展的限制</h3>
<p>模块增补用于修补已有声明，不是给目标模块随意增加从未存在的新顶层导出。默认导出也不能像普通具名导出那样直接按 default 名字进行增补。遇到这种需求，更适合考虑包装 API、扩展库已公开的接口，或修正原始声明。</p>
<p>全局增补可以在模块文件中使用 declare global，例如描述由宿主实际提供的页面字段：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// globals.d.ts</span>
<span class="hljs-keyword">export</span> {};

<span class="hljs-keyword">declare</span> <span class="hljs-variable language_">global</span> {
  <span class="hljs-keyword">interface</span> <span class="hljs-title class_">Window</span> {
    <span class="hljs-attr">appVersion</span>?: <span class="hljs-built_in">string</span>;
  }
}
</code></pre></div>
<p>这只说明 window.appVersion 可能存在，不会真的给浏览器写入版本号。若业务需要它，仍需某处真实赋值；如果不保证宿主已经安装，就不应随意声明为必需字段，让所有调用方误以为它永远可用。</p>
<h3>什么时候应该避免增补</h3>
<p>类型增补适合稳定的扩展点或修正缺失声明，不适合拿来掩盖版本不兼容。库已经删除某个方法时，仅在类型中加回来，不会让实现复活。</p>
<p>全局合并与原型补丁还会影响其他消费者，可能发生重名或升级冲突。能通过局部包装函数表达的能力，未必需要修改全局类型或第三方原型。</p>
<p>验证时应同时检查：编译器能找到增补、原来的导出没有被意外遮蔽、入口确实加载实现，以及升级后目标对象仍满足这些假设。只看到编辑器自动补全多了一个方法，还不足以证明扩展已经正确接入。</p>`};export{e as default};