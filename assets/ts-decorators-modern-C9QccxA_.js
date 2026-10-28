var e={answerHtml:`<h2>简答</h2>
<ul>
<li>TypeScript 5.0 起支持 ECMAScript 标准装饰器，不需要 experimentalDecorators。</li>
<li>标准装饰器接收 value 和 context 两个参数，通过 context.addInitializer 注册初始化逻辑。</li>
<li>旧版 experimentalDecorators 的签名不同，并支持参数装饰器和 emitDecoratorMetadata。</li>
<li>依赖旧装饰器的框架（如部分 DI 库）不能直接切换到标准装饰器。</li>
</ul>
<p>装饰器是会在运行时参与类或成员定义的代码，不是像 interface 那样编译后就只剩空气的类型标注。它可以包装方法、参与字段初始化或注册额外行为，因此语义不同的装饰器方案不能只靠同一个 @ 外观混用。</p>
<p>TypeScript 5.0 开始支持的现代方案，主要使用“被装饰的值 + 上下文对象”；experimentalDecorators 对应的旧实验方案，则有 target、属性名、描述符等另一套约定。</p>
<h2>现代方法装饰器收到原方法与 context</h2>
<p>下面的文件使用现代装饰器配置，不开启 experimentalDecorators：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// modern.ts</span>
<span class="hljs-keyword">function</span> logged&lt;<span class="hljs-title class_">This</span>, <span class="hljs-title class_">Args</span> <span class="hljs-keyword">extends</span> <span class="hljs-built_in">unknown</span>[], <span class="hljs-title class_">Result</span>&gt;(
  <span class="hljs-attr">method</span>: <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">this</span>: <span class="hljs-title class_">This</span>, ...<span class="hljs-attr">args</span>: <span class="hljs-title class_">Args</span></span>) =&gt;</span> <span class="hljs-title class_">Result</span>,
  <span class="hljs-attr">context</span>: <span class="hljs-title class_">ClassMethodDecoratorContext</span>&lt;<span class="hljs-title class_">This</span>, <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">this</span>: <span class="hljs-title class_">This</span>, ...<span class="hljs-attr">args</span>: <span class="hljs-title class_">Args</span></span>) =&gt;</span> <span class="hljs-title class_">Result</span>&gt;,
) {
  <span class="hljs-keyword">const</span> name = <span class="hljs-title class_">String</span>(context.<span class="hljs-property">name</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> (<span class="hljs-params"><span class="hljs-attr">this</span>: <span class="hljs-title class_">This</span>, ...<span class="hljs-attr">args</span>: <span class="hljs-title class_">Args</span></span>): <span class="hljs-title class_">Result</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`调用 <span class="hljs-subst">\${name}</span>\`</span>);
    <span class="hljs-keyword">return</span> method.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, args);
  };
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Counter</span> {
  value = <span class="hljs-number">0</span>;

  <span class="hljs-meta">@logged</span>
  <span class="hljs-title function_">add</span>(<span class="hljs-attr">step</span>: <span class="hljs-built_in">number</span>): <span class="hljs-built_in">number</span> {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span> += step;
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span>;
  }
}

<span class="hljs-keyword">const</span> counter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Counter</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(counter.<span class="hljs-title function_">add</span>(<span class="hljs-number">2</span>)); <span class="hljs-comment">// 先输出 调用 add，再输出 2</span>
</code></pre></div>
<p>装饰器返回替代方法，包装函数保留原来的 this、参数和返回类型。不能用一个不关心 this 的箭头函数随意替换实例方法，否则调用接收者可能变化。</p>
<p>context 提供成员种类、名称、静态或私有等信息。不同种类的装饰目标有不同上下文与允许的返回形式，不能把方法装饰器的处理方式直接套到字段或类上。</p>
<p>这里的日志只表示开始调用。若方法返回 Promise，包装函数立即返回同一个结果，并没有等待异步工作结束；想记录异步完成需要另外设计，同时保持原接口的返回与错误语义。</p>
<h2>旧方案使用另一套调用协议</h2>
<p>下面是单独的 legacy.ts，需要开启 experimentalDecorators。它不是给上面现代装饰器再补一个开关：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// legacy.ts</span>
<span class="hljs-keyword">function</span> legacyLogged&lt;<span class="hljs-title class_">This</span>, <span class="hljs-title class_">Args</span> <span class="hljs-keyword">extends</span> <span class="hljs-built_in">unknown</span>[], <span class="hljs-title class_">Result</span>&gt;(
  <span class="hljs-attr">_target</span>: <span class="hljs-built_in">object</span>,
  <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span> | <span class="hljs-built_in">symbol</span>,
  <span class="hljs-attr">descriptor</span>: <span class="hljs-title class_">TypedPropertyDescriptor</span>&lt;<span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">this</span>: <span class="hljs-title class_">This</span>, ...<span class="hljs-attr">args</span>: <span class="hljs-title class_">Args</span></span>) =&gt;</span> <span class="hljs-title class_">Result</span>&gt;,
): <span class="hljs-built_in">void</span> {
  <span class="hljs-keyword">const</span> original = descriptor.<span class="hljs-property">value</span>;
  <span class="hljs-keyword">if</span> (!original) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;该装饰器只处理方法&#x27;</span>);

  descriptor.<span class="hljs-property">value</span> = <span class="hljs-keyword">function</span> (<span class="hljs-params"><span class="hljs-attr">this</span>: <span class="hljs-title class_">This</span>, ...<span class="hljs-attr">args</span>: <span class="hljs-title class_">Args</span></span>): <span class="hljs-title class_">Result</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`旧方案调用 <span class="hljs-subst">\${<span class="hljs-built_in">String</span>(name)}</span>\`</span>);
    <span class="hljs-keyword">return</span> original.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, args);
  };
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Counter</span> {
  value = <span class="hljs-number">0</span>;

  <span class="hljs-meta">@legacyLogged</span>
  <span class="hljs-title function_">add</span>(<span class="hljs-attr">step</span>: <span class="hljs-built_in">number</span>): <span class="hljs-built_in">number</span> {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span> += step;
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span>;
  }
}

<span class="hljs-keyword">const</span> counter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Counter</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(counter.<span class="hljs-title function_">add</span>(<span class="hljs-number">2</span>)); <span class="hljs-comment">// 先输出 旧方案调用 add，再输出 2</span>
</code></pre></div>
<p>旧方法装饰器通过描述符修改方法，参数签名与现代方案不同。把现代实现放进旧配置，或把依赖三个参数的旧方法装饰器当成现代实现使用，都可能产生类型诊断或运行时不匹配。</p>
<p>因此升级框架时要确认它要求哪套语义，而不是看到项目里有 @ 就默认开启或关闭 experimentalDecorators。</p>
<h2>定义、初始化和调用是不同时间点</h2>
<p>装饰器表达式通常在类定义求值过程中参与处理，不是每次 new 实例都会重新装饰一遍方法。现代 context.addInitializer 可以登记初始化逻辑，再按目标种类在实例或静态初始化的时机执行。</p>
<p>例如需要把某个方法绑定到每个实例时，初始化钩子可以帮助建立实例上的绑定。但它运行的具体阶段与目标是方法、字段、静态成员还是类有关，应按接口规则安排，不能假定所有初始化都发生在构造函数最后一行之后。</p>
<p>多个装饰器叠加时，还要区分装饰器表达式的求值顺序、装饰器应用顺序以及最终包装方法的调用顺序。只看一条日志，很容易把这几个阶段误认为同一个过程。</p>
<h2>参数装饰器和反射元数据不能直接搬过去</h2>
<p>旧方案支持一些现有库依赖的参数装饰器与 emitDecoratorMetadata 输出机制。现代方案不是同一套协议，不能按旧规则装饰参数，也不兼容旧 emitDecoratorMetadata 的直接使用方式。</p>
<p>依赖旧反射元数据的依赖注入框架，可能通过运行时库读取编译器生成的信息。关掉旧选项后，即使类看上去还能定义，也可能无法按原方式获得依赖信息。迁移应核对框架版本、装饰器实现和元数据消费方。</p>
<p>后续的装饰器元数据能力，例如相关 context.metadata 与 Symbol.metadata 机制，也不自动等同于旧的设计类型元数据输出。API、编译器与运行环境支持需要分别确认，不能仅凭名字里都有 metadata 就认定兼容。</p>
<h2>装饰器改变行为，不自动改变外部类型契约</h2>
<p>一个装饰器运行时给实例增加了字段，不代表调用方的类类型就自动出现这个字段；替换构造器、绑定方法或修改初始化，也需要维持原本对外承诺的结构与行为。</p>
<p>装饰器还可能引入模块顶层副作用和额外运行时依赖。只以 import type 导入相关值并不能执行注册逻辑，打包器的副作用处理、类字段输出方式与不同转换器配置也可能影响最终结果。</p>
<h2>怎样验证迁移是否真的成功</h2>
<p>至少分别编译现代和旧方案的最小文件，确认使用的配置、参数签名与产物；再实际调用方法，检查 this、参数、返回值、异常和异步行为没有变化。</p>
<p>如果使用初始化钩子或元数据，还要验证多个实例、静态成员、继承与缺失元数据的情况。仅仅“编译不报错”不能证明框架在运行时读到了原来需要的信息。</p>
<p>最后，TypeScript 能把装饰器转换成目标 JavaScript，不代表所有浏览器已经原生接受同样的 @ 语法。发布产物仍需与目标环境匹配，并确保整条构建链使用的是同一套装饰器语义。</p>`};export{e as default};