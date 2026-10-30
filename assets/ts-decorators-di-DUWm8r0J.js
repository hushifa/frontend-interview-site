var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如 NestJS 里写 <code>constructor(private logger: Logger)</code>，什么都不用配，框架就能自动传进来一个 <code>Logger</code> 实例。它靠的是装饰器元数据：开启 <code>experimentalDecorators</code> 和 <code>emitDecoratorMetadata</code> 以后，TypeScript 会给带装饰器的类多生成一行 <code>design:paramtypes</code>，把构造函数参数的类型记成运行时能读到的数组，比如 <code>[Logger]</code>。</p>
<p>依赖注入容器在创建类的时候读这个数组，先把每个依赖创建出来（依赖还有依赖就继续往下创建），再传给构造函数，并把实例缓存起来复用。读写元数据的 API 通常由 <code>reflect-metadata</code> 这个库提供，它不是 JavaScript 标准的一部分。</p>
<p>这套机制有两个限制。接口和类型别名在编译后会被擦掉，元数据里只剩 <code>Object</code>，容器不知道该注入什么，所以 NestJS 要求用 <code>@Inject(token)</code> 显式指定。另外 TS 5.0 的标准装饰器不会生成 <code>design:paramtypes</code>，也没有参数装饰器，依赖这套机制的框架不能直接切换。</p>
<p>标准装饰器也有自己的元数据：TS 5.2 起，装饰器可以往 <code>context.metadata</code> 里写数据，类定义完以后从 <code>类[Symbol.metadata]</code> 读出来，但写什么要自己决定，编译器不会替你记类型。Angular 现在推荐用 <code>inject()</code> 函数获取依赖，不必依赖构造函数参数的类型元数据。</p>
</blockquote>
<h2>emitDecoratorMetadata 到底生成了什么</h2>
<p>先看编译器做了什么。下面的类有一个装饰器，构造函数要一个 <code>Logger</code>：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Injectable</span>(<span class="hljs-params"></span>): <span class="hljs-title class_">ClassDecorator</span> {
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Logger</span> {
  <span class="hljs-title function_">log</span>(<span class="hljs-params"><span class="hljs-attr">message</span>: <span class="hljs-built_in">string</span></span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(message);
  }
}

<span class="hljs-meta">@Injectable</span>()
<span class="hljs-keyword">class</span> <span class="hljs-title class_">UserService</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"><span class="hljs-keyword">private</span> <span class="hljs-attr">logger</span>: <span class="hljs-title class_">Logger</span></span>) {}
}
</code></pre></div>
<p>用 TypeScript 7.0.2 加 <code>--experimentalDecorators --emitDecoratorMetadata</code> 编译，输出的 JavaScript 末尾是这样的：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title class_">UserService</span> = <span class="hljs-title function_">__decorate</span>([
    <span class="hljs-title class_">Injectable</span>(),
    <span class="hljs-title function_">__metadata</span>(<span class="hljs-string">&quot;design:paramtypes&quot;</span>, [<span class="hljs-title class_">Logger</span>])
], <span class="hljs-title class_">UserService</span>);
</code></pre></div>
<p>多出来的 <code>__metadata(&quot;design:paramtypes&quot;, [Logger])</code> 就是关键。类型注解 <code>Logger</code> 本来在编译后会消失，现在被写成了一个真实的数组，里面放的是 <code>Logger</code> 这个类本身。<code>__metadata</code> 会调用 <code>Reflect.metadata</code>，这个函数由 <code>reflect-metadata</code> 库提供。TypeScript 手册说明，开启 <code>emitDecoratorMetadata</code> 并导入 <code>reflect-metadata</code> 以后，设计时的类型信息就能在运行时拿到。</p>
<p>为什么类上要有装饰器？去掉 <code>@Injectable()</code> 再用同样的选项编译，输出里就没有 <code>__metadata</code> 了，编译器只给带装饰器的声明生成元数据。NestJS 文档对 <code>@Injectable()</code> 的说明是，它给类附加元数据，声明这个类可以交给 Nest 的 IoC 容器管理。</p>
<h2>用元数据写一个最小的 DI 容器</h2>
<p>知道了元数据长什么样，容器的逻辑就清楚了：读 <code>design:paramtypes</code>，递归创建每个依赖，再 <code>new</code> 出目标类。下面不装 <code>reflect-metadata</code>，手写一个简化的元数据容器代替它，只为看清机制：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// 需要 &quot;experimentalDecorators&quot;: true 和 &quot;emitDecoratorMetadata&quot;: true</span>
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Constructor</span>&lt;T = <span class="hljs-built_in">unknown</span>&gt; = <span class="hljs-title function_">new</span> (...<span class="hljs-attr">args</span>: <span class="hljs-built_in">any</span>[]) =&gt; T;

<span class="hljs-comment">// 手写的简化元数据容器，代替 reflect-metadata 的 Reflect.defineMetadata / getMetadata。</span>
<span class="hljs-keyword">const</span> metadataStore = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WeakMap</span>&lt;<span class="hljs-built_in">object</span>, <span class="hljs-title class_">Map</span>&lt;<span class="hljs-built_in">string</span>, <span class="hljs-built_in">unknown</span>&gt;&gt;();

<span class="hljs-keyword">function</span> <span class="hljs-title function_">defineMetadata</span>(<span class="hljs-params"><span class="hljs-attr">key</span>: <span class="hljs-built_in">string</span>, <span class="hljs-attr">value</span>: <span class="hljs-built_in">unknown</span>, <span class="hljs-attr">target</span>: <span class="hljs-built_in">object</span></span>) {
  <span class="hljs-keyword">let</span> map = metadataStore.<span class="hljs-title function_">get</span>(target);
  <span class="hljs-keyword">if</span> (!map) metadataStore.<span class="hljs-title function_">set</span>(target, (map = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>()));
  map.<span class="hljs-title function_">set</span>(key, value);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">getMetadata</span>(<span class="hljs-params"><span class="hljs-attr">key</span>: <span class="hljs-built_in">string</span>, <span class="hljs-attr">target</span>: <span class="hljs-built_in">object</span></span>): <span class="hljs-built_in">unknown</span> {
  <span class="hljs-keyword">return</span> metadataStore.<span class="hljs-title function_">get</span>(target)?.<span class="hljs-title function_">get</span>(key);
}

<span class="hljs-comment">// 编译器生成的代码会调用 Reflect.metadata，这里提供一个最小实现。</span>
(<span class="hljs-title class_">Reflect</span> <span class="hljs-keyword">as</span> <span class="hljs-built_in">any</span>).<span class="hljs-property">metadata</span> = <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">key</span>: <span class="hljs-built_in">string</span>, <span class="hljs-attr">value</span>: <span class="hljs-built_in">unknown</span></span>) =&gt;</span> <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">target</span>: <span class="hljs-built_in">object</span></span>) =&gt;</span>
  <span class="hljs-title function_">defineMetadata</span>(key, value, target);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Injectable</span>(<span class="hljs-params"></span>): <span class="hljs-title class_">ClassDecorator</span> {
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Container</span> {
  <span class="hljs-keyword">private</span> instances = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>&lt;<span class="hljs-title class_">Constructor</span>, <span class="hljs-built_in">unknown</span>&gt;();

  resolve&lt;T&gt;(<span class="hljs-attr">token</span>: <span class="hljs-title class_">Constructor</span>&lt;T&gt;): T {
    <span class="hljs-keyword">const</span> cached = <span class="hljs-variable language_">this</span>.<span class="hljs-property">instances</span>.<span class="hljs-title function_">get</span>(token);
    <span class="hljs-keyword">if</span> (cached) <span class="hljs-keyword">return</span> cached <span class="hljs-keyword">as</span> T;
    <span class="hljs-keyword">const</span> deps = (<span class="hljs-title function_">getMetadata</span>(<span class="hljs-string">&#x27;design:paramtypes&#x27;</span>, token) ?? []) <span class="hljs-keyword">as</span> <span class="hljs-title class_">Constructor</span>[];
    <span class="hljs-keyword">const</span> instance = <span class="hljs-keyword">new</span> <span class="hljs-title function_">token</span>(...deps.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">dep</span>) =&gt;</span> <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">resolve</span>(dep)));
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">instances</span>.<span class="hljs-title function_">set</span>(token, instance);
    <span class="hljs-keyword">return</span> instance;
  }
}

<span class="hljs-meta">@Injectable</span>()
<span class="hljs-keyword">class</span> <span class="hljs-title class_">Logger</span> {
  <span class="hljs-title function_">log</span>(<span class="hljs-params"><span class="hljs-attr">message</span>: <span class="hljs-built_in">string</span></span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`[log] <span class="hljs-subst">\${message}</span>\`</span>);
  }
}

<span class="hljs-meta">@Injectable</span>()
<span class="hljs-keyword">class</span> <span class="hljs-title class_">UserService</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"><span class="hljs-keyword">private</span> <span class="hljs-attr">logger</span>: <span class="hljs-title class_">Logger</span></span>) {}

  <span class="hljs-title function_">greet</span>(<span class="hljs-params"><span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">logger</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`你好，<span class="hljs-subst">\${name}</span>\`</span>);
  }
}

<span class="hljs-keyword">const</span> container = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Container</span>();
container.<span class="hljs-title function_">resolve</span>(<span class="hljs-title class_">UserService</span>).<span class="hljs-title function_">greet</span>(<span class="hljs-string">&#x27;小明&#x27;</span>); <span class="hljs-comment">// 输出：[log] 你好，小明</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(container.<span class="hljs-title function_">resolve</span>(<span class="hljs-title class_">Logger</span>) === container.<span class="hljs-title function_">resolve</span>(<span class="hljs-title class_">Logger</span>)); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>这段代码用 TypeScript 7.0.2 在 <code>--strict --experimentalDecorators --emitDecoratorMetadata</code> 下编译通过，用 Node.js 运行输出注释里的两行。</p>
<p><code>resolve(UserService)</code> 读到 <code>[Logger]</code>，先去 <code>resolve(Logger)</code>；<code>Logger</code> 的构造函数没有参数，直接创建。然后把 <code>Logger</code> 实例传给 <code>UserService</code>。创建过的实例放进 <code>instances</code>，所以第二次取 <code>Logger</code> 拿到的是同一个，这就是单例作用域。</p>
<p>NestJS 文档描述的过程和这个一致：它按类型解析依赖，实例化 <code>CatsController</code> 时先找出它的依赖 <code>CatsService</code>，在默认的单例作用域下创建一个实例、缓存起来再返回；依赖分析是传递的，依赖的依赖也会被解析。真实框架还要处理循环依赖、不同作用域、模块边界，这里都省略了。</p>
<h2>为什么接口不能直接注入</h2>
<p>把构造函数参数换成接口，看看元数据变成什么：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Injectable</span>(<span class="hljs-params"></span>): <span class="hljs-title class_">ClassDecorator</span> {
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};
}

<span class="hljs-keyword">interface</span> <span class="hljs-title class_">KeyValueStore</span> {
  <span class="hljs-title function_">get</span>(<span class="hljs-attr">key</span>: <span class="hljs-built_in">string</span>): <span class="hljs-built_in">string</span> | <span class="hljs-literal">undefined</span>;
}

<span class="hljs-meta">@Injectable</span>()
<span class="hljs-keyword">class</span> <span class="hljs-title class_">ConfigService</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"><span class="hljs-keyword">private</span> <span class="hljs-attr">store</span>: <span class="hljs-title class_">KeyValueStore</span></span>) {}
}
</code></pre></div>
<p>同样用 TypeScript 7.0.2 编译，生成的是 <code>__metadata(&quot;design:paramtypes&quot;, [Object])</code>。接口只存在于类型系统里，编译后什么都不剩，编译器只能写一个 <code>Object</code>。容器拿到 <code>Object</code>，根本不知道该创建什么。</p>
<p>NestJS 文档也写明，类型和接口在编译时被擦除，Nest 在运行时引用不到它们，接口可以描述依赖的形状，但不能单独作为 DI 的 token。解决办法是用一个运行时存在的值做 token，比如字符串或 Symbol，注册 provider 时写 <code>{ provide: CACHE, useValue: ... }</code> 或者 <code>useClass</code>、<code>useFactory</code>，注入时用 <code>@Inject(token)</code> 告诉框架要哪一个。</p>
<p><code>@Inject</code> 是一个参数装饰器，它做的事情就是把 token 记到“第几个参数”上。下面手写一个简化版：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// 需要 &quot;experimentalDecorators&quot;: true</span>
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">INJECT_TOKENS</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WeakMap</span>&lt;<span class="hljs-built_in">object</span>, <span class="hljs-built_in">unknown</span>[]&gt;();

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Inject</span>(<span class="hljs-params"><span class="hljs-attr">token</span>: <span class="hljs-built_in">unknown</span></span>): <span class="hljs-title class_">ParameterDecorator</span> {
  <span class="hljs-keyword">return</span> <span class="hljs-function">(<span class="hljs-params">target, _key, index</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> tokens = <span class="hljs-variable constant_">INJECT_TOKENS</span>.<span class="hljs-title function_">get</span>(target) ?? [];
    tokens[index] = token;
    <span class="hljs-variable constant_">INJECT_TOKENS</span>.<span class="hljs-title function_">set</span>(target, tokens);
  };
}

<span class="hljs-keyword">interface</span> <span class="hljs-title class_">Cache</span> {
  <span class="hljs-title function_">get</span>(<span class="hljs-attr">key</span>: <span class="hljs-built_in">string</span>): <span class="hljs-built_in">string</span> | <span class="hljs-literal">undefined</span>;
}

<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">CACHE</span> = <span class="hljs-title class_">Symbol</span>(<span class="hljs-string">&#x27;CACHE&#x27;</span>);

<span class="hljs-keyword">class</span> <span class="hljs-title class_">ProfileService</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"><span class="hljs-meta">@Inject</span>(CACHE) <span class="hljs-keyword">private</span> <span class="hljs-attr">cache</span>: <span class="hljs-title class_">Cache</span></span>) {}
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-variable constant_">INJECT_TOKENS</span>.<span class="hljs-title function_">get</span>(<span class="hljs-title class_">ProfileService</span>)); <span class="hljs-comment">// 输出：[ Symbol(CACHE) ]</span>
</code></pre></div>
<p>构造函数参数上的装饰器，<code>target</code> 就是类本身，<code>index</code> 是参数位置。容器创建 <code>ProfileService</code> 时，先看这个位置有没有显式 token，有就按 token 找 provider，没有再用 <code>design:paramtypes</code> 里的类型。NestJS 文档还提到，抽象类和接口不同，它在运行时存在，可以直接当 token，不需要 <code>@Inject()</code>。</p>
<h2>标准装饰器怎样记录元数据</h2>
<p>TypeScript 5.0 起，不开 <code>experimentalDecorators</code> 时用的是 TC39 标准装饰器。它不支持 <code>emitDecoratorMetadata</code>，也没有参数装饰器，所以上面这套“按构造函数参数类型注入”的做法用不了，两套装饰器的区别见<a href="/questions/ts-decorators-modern/">《TypeScript 新装饰器与 experimentalDecorators 有何区别？》</a>。</p>
<p>TypeScript 5.2 实现了装饰器元数据提案：每个装饰器的 <code>context</code> 上多了一个 <code>metadata</code> 对象，同一个类上的所有装饰器拿到的是同一个对象；类定义完成后，这个对象挂在 <code>类[Symbol.metadata]</code> 上。和旧方案不同，里面放什么完全由装饰器自己决定，编译器不会自动写入类型。</p>
<p>下面用字段装饰器 <code>@inject(Logger)</code> 把依赖记进元数据，再由 <code>create</code> 读出来填进实例：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// 标准装饰器，不开 experimentalDecorators；lib 需要包含 esnext.decorators</span>
(<span class="hljs-title class_">Symbol</span> <span class="hljs-keyword">as</span> { <span class="hljs-attr">metadata</span>: <span class="hljs-built_in">symbol</span> }).<span class="hljs-property">metadata</span> ??= <span class="hljs-title class_">Symbol</span>(<span class="hljs-string">&#x27;Symbol.metadata&#x27;</span>);

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Constructor</span>&lt;T = <span class="hljs-built_in">unknown</span>&gt; = <span class="hljs-title function_">new</span> () =&gt; T;
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">INJECT</span> = <span class="hljs-title class_">Symbol</span>(<span class="hljs-string">&#x27;inject&#x27;</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">inject</span>(<span class="hljs-params"><span class="hljs-attr">token</span>: <span class="hljs-title class_">Constructor</span></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> (<span class="hljs-params"><span class="hljs-attr">_value</span>: <span class="hljs-literal">undefined</span>, <span class="hljs-attr">context</span>: <span class="hljs-title class_">ClassFieldDecoratorContext</span></span>) {
    <span class="hljs-keyword">const</span> fields = (context.<span class="hljs-property">metadata</span>[<span class="hljs-variable constant_">INJECT</span>] ??= {}) <span class="hljs-keyword">as</span> <span class="hljs-title class_">Record</span>&lt;<span class="hljs-title class_">PropertyKey</span>, <span class="hljs-title class_">Constructor</span>&gt;;
    fields[context.<span class="hljs-property">name</span>] = token;
  };
}

<span class="hljs-keyword">function</span> create&lt;T&gt;(<span class="hljs-attr">cls</span>: <span class="hljs-title class_">Constructor</span>&lt;T&gt;): T {
  <span class="hljs-keyword">const</span> instance = <span class="hljs-keyword">new</span> <span class="hljs-title function_">cls</span>();
  <span class="hljs-keyword">const</span> fields = (cls[<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">metadata</span>]?.[<span class="hljs-variable constant_">INJECT</span>] ?? {}) <span class="hljs-keyword">as</span> <span class="hljs-title class_">Record</span>&lt;<span class="hljs-title class_">PropertyKey</span>, <span class="hljs-title class_">Constructor</span>&gt;;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [name, token] <span class="hljs-keyword">of</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">entries</span>(fields)) {
    (instance <span class="hljs-keyword">as</span> <span class="hljs-title class_">Record</span>&lt;<span class="hljs-built_in">string</span>, <span class="hljs-built_in">unknown</span>&gt;)[name] = <span class="hljs-title function_">create</span>(token);
  }
  <span class="hljs-keyword">return</span> instance;
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Logger</span> {
  <span class="hljs-title function_">log</span>(<span class="hljs-params"><span class="hljs-attr">message</span>: <span class="hljs-built_in">string</span></span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`[log] <span class="hljs-subst">\${message}</span>\`</span>);
  }
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">UserService</span> {
  <span class="hljs-meta">@inject</span>(<span class="hljs-title class_">Logger</span>) logger!: <span class="hljs-title class_">Logger</span>;
}

<span class="hljs-title function_">create</span>(<span class="hljs-title class_">UserService</span>).<span class="hljs-property">logger</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;已注入&#x27;</span>); <span class="hljs-comment">// 输出：[log] 已注入</span>
</code></pre></div>
<p>这段代码用 TypeScript 7.0.2 在 <code>--strict --target es2022 --lib es2022,esnext.decorators,dom</code> 下编译通过，运行输出注释里的一行。</p>
<p>第一行是 TypeScript 5.2 发布说明给出的 polyfill，因为大多数运行时还没有原生的 <code>Symbol.metadata</code>；发布说明还要求 <code>target</code> 设为 es2022 或更低，<code>lib</code> 包含 <code>esnext</code> 或 <code>esnext.decorators</code>。token 要在 <code>@inject(...)</code> 里显式写出来，因为标准装饰器拿不到字段的类型注解。按 TC39 提案，子类的元数据对象以父类的元数据对象为原型，所以子类能读到父类记录的内容。</p>
<h2>Angular 现在怎样注入</h2>
<p>Angular 文档推荐用 <code>inject()</code> 函数获取依赖，可以写在字段初始化里，也可以写在构造函数体里：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-meta">@Service</span>()
<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">UserService</span> {
  <span class="hljs-keyword">private</span> http = <span class="hljs-title function_">inject</span>(<span class="hljs-title class_">HttpClient</span>);
}
</code></pre></div>
<p><code>inject(HttpClient)</code> 直接把类当参数传进去，依赖是谁写在代码里，不需要从构造函数参数的类型元数据里推断。文档写明，<code>@Service()</code> 是 <code>@Injectable({ providedIn: &#x27;root&#x27; })</code> 的简写，会把服务注册成全应用共享的单例。注入器的层级和作用域见<a href="/questions/frameworks-angular-di/">《Angular 依赖注入的层级和作用域怎样理解？》</a>。</p>
<h2>常见追问</h2>
<p><strong>reflect-metadata 是什么？不装会怎样？</strong></p>
<blockquote>
<p>它是一个 polyfill 库，提供 <code>Reflect.defineMetadata</code>、<code>Reflect.getMetadata</code>、<code>Reflect.metadata</code> 这些 API。TypeScript 手册说明它还不是 ECMAScript 标准的一部分。编译器生成的 <code>__metadata</code> 会先检查 <code>Reflect.metadata</code> 是否存在，不存在就什么也不做，所以不导入它，代码不会报错，但类型元数据不会被记下来，依赖它的容器就解析不出依赖。</p>
</blockquote>
<p><strong>为什么 NestJS 项目还不能换成标准装饰器？</strong></p>
<blockquote>
<p>因为 NestJS 的构造函数注入依赖 <code>design:paramtypes</code>，<code>@Inject()</code> 又是参数装饰器。标准装饰器既不生成这种类型元数据，也不支持参数装饰器，所以这类项目要继续开 <code>experimentalDecorators</code> 和 <code>emitDecoratorMetadata</code>。</p>
</blockquote>
<p><strong>多个装饰器写在一起，执行顺序是怎样的？</strong></p>
<blockquote>
<p>TypeScript 手册的说法是：装饰器表达式从上往下求值，得到的函数从下往上调用，像数学里的函数组合 <code>f(g(x))</code>。所以 <code>@a() @b() method</code>，先求值 <code>a()</code> 再求值 <code>b()</code>，调用时先调 <code>b</code> 返回的装饰器，再调 <code>a</code> 返回的。</p>
</blockquote>`};export{e as default};