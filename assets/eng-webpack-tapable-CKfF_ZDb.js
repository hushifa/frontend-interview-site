var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>执行一次 <code>webpack</code> 构建，内部会先创建一个 <code>compiler</code> 对象，它代表整个 webpack 实例，从启动到结束只有一个。每开始一次构建，<code>compiler</code> 再创建一个 <code>compilation</code>，它代表这一次构建，watch 模式下每次重新构建都会有新的 <code>compilation</code>。</p>
<p>流程按 compiler 上的钩子走：<code>run</code> 开始，<code>compile</code> 准备创建 compilation，<code>thisCompilation</code> 和 <code>compilation</code> 在它创建后触发；接着是 <code>make</code>，从入口出发，用 loader 转换每个模块、解析依赖，建出模块图；<code>finishMake</code> 表示所有入口和依赖都加进来了；然后 compilation 执行 <code>seal</code>，不再接受新模块，开始优化、分 chunk、生成产物，<code>processAssets</code> 就在这个阶段；之后是 <code>afterCompile</code>、<code>emit</code>（写入输出目录之前）、<code>afterEmit</code> 和 <code>done</code>。</p>
<p>这些钩子都来自 Tapable 库。插件通过 <code>tap</code> 注册同步回调，异步钩子还能用 <code>tapAsync</code>（最后一个参数是 callback）和 <code>tapPromise</code>（返回 Promise）。Tapable 的钩子类型从两个角度分：执行方式有 Sync、AsyncSeries（一个接一个）、AsyncParallel（同时跑）；回调返回值的作用有基础钩子（忽略返回值）、Bail（有返回值就停）、Waterfall（返回值传给下一个）、Loop（有返回值就从头再来）。</p>
<p>写插件时要注意选对钩子。webpack 文档在 <code>emit</code> 里写明，不要在这里新增或修改产物，因为它在 compilation 封存之后才执行，此时 <code>processAssets</code> 的各个阶段都已经跑完了，要改产物应该在 <code>processAssets</code> 里改。</p>
</blockquote>
<h2>构建流程和钩子</h2>
<p>下面按顺序列出 webpack 文档里 compiler 上的主要钩子和类型。类型决定了能用哪种 tap 方法：<code>SyncHook</code> 只能 <code>tap</code>，<code>AsyncSeriesHook</code> 和 <code>AsyncParallelHook</code> 三种都可以。</p>
<table><thead><tr><th>钩子</th><th>类型</th><th>文档说明</th></tr></thead><tbody><tr><td><code>run</code></td><td>AsyncSeriesHook</td><td>开始读取 records 之前</td></tr><tr><td><code>compile</code></td><td>SyncHook</td><td>创建新的 compilation 之前</td></tr><tr><td><code>thisCompilation</code> / <code>compilation</code></td><td>SyncHook</td><td>compilation 创建时与创建后</td></tr><tr><td><code>make</code></td><td>AsyncParallelHook</td><td>完成 compilation 之前</td></tr><tr><td><code>finishMake</code></td><td>AsyncSeriesHook</td><td>所有入口和依赖都已加入 compilation</td></tr><tr><td><code>afterCompile</code></td><td>AsyncSeriesHook</td><td>compilation 完成并封存之后</td></tr><tr><td><code>emit</code></td><td>AsyncSeriesHook</td><td>把产物写入输出目录之前</td></tr><tr><td><code>afterEmit</code></td><td>AsyncSeriesHook</td><td>产物写入输出目录之后</td></tr><tr><td><code>done</code></td><td>AsyncSeriesHook</td><td>本次构建结束，参数是 <code>stats</code></td></tr></tbody></table>
<p><code>seal</code> 是 compilation 上的钩子，文档说明它在 compilation 停止接受新模块时触发。从这里开始，webpack 不再找新模块，而是把已有模块分成 chunk、生成代码、计算哈希，产物在这个阶段形成，<code>processAssets</code> 也在这里执行。</p>
<p>为什么 <code>make</code> 是 AsyncParallelHook？因为多个入口可以同时开始构建，互不依赖。而 <code>emit</code>、<code>done</code> 是 AsyncSeriesHook，插件要按顺序一个个执行，前一个做完后一个才开始。</p>
<p>插件的写法和 compiler、compilation 的分工，见<a href="/questions/eng-loader-plugin/">《webpack 的 loader 和 plugin 有什么区别？怎样手写一个？》</a>。webpack 的基本配置见<a href="/questions/eng-webpack/">《webpack 的 entry、output、loader 和 plugin 分别负责什么？》</a>。</p>
<h2>手写简化版 SyncHook 和 AsyncSeriesHook</h2>
<p>真正的 Tapable 会根据注册的回调数量和类型生成执行代码，还支持拦截器、<code>stage</code> 和 <code>before</code> 等选项。下面只写出最核心的行为：注册回调，按注册顺序调用。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">SyncHook</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">args = []</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">args</span> = args;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">taps</span> = [];
  }
  <span class="hljs-title function_">tap</span>(<span class="hljs-params">name, fn</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">taps</span>.<span class="hljs-title function_">push</span>({ name, fn });
  }
  <span class="hljs-title function_">call</span>(<span class="hljs-params">...args</span>) {
    <span class="hljs-comment">// 基础钩子忽略回调的返回值</span>
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> { fn } <span class="hljs-keyword">of</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">taps</span>) <span class="hljs-title function_">fn</span>(...args);
  }
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">AsyncSeriesHook</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">args = []</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">args</span> = args;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">taps</span> = [];
  }
  <span class="hljs-title function_">tap</span>(<span class="hljs-params">name, fn</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">taps</span>.<span class="hljs-title function_">push</span>({ name, <span class="hljs-attr">run</span>: <span class="hljs-function">(<span class="hljs-params">args</span>) =&gt;</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(<span class="hljs-title function_">fn</span>(...args)) });
  }
  <span class="hljs-title function_">tapPromise</span>(<span class="hljs-params">name, fn</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">taps</span>.<span class="hljs-title function_">push</span>({ name, <span class="hljs-attr">run</span>: <span class="hljs-function">(<span class="hljs-params">args</span>) =&gt;</span> <span class="hljs-title function_">fn</span>(...args) });
  }
  <span class="hljs-title function_">tapAsync</span>(<span class="hljs-params">name, fn</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">taps</span>.<span class="hljs-title function_">push</span>({
      name,
      <span class="hljs-attr">run</span>: <span class="hljs-function">(<span class="hljs-params">args</span>) =&gt;</span>
        <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
          <span class="hljs-title function_">fn</span>(...args, <span class="hljs-function">(<span class="hljs-params">err</span>) =&gt;</span> (err ? <span class="hljs-title function_">reject</span>(err) : <span class="hljs-title function_">resolve</span>()));
        }),
    });
  }
  <span class="hljs-keyword">async</span> <span class="hljs-title function_">promise</span>(<span class="hljs-params">...args</span>) {
    <span class="hljs-comment">// 上一个回调完成后再执行下一个</span>
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> { run } <span class="hljs-keyword">of</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">taps</span>) <span class="hljs-keyword">await</span> <span class="hljs-title function_">run</span>(args);
  }
}

<span class="hljs-keyword">const</span> logs = [];
<span class="hljs-keyword">const</span> compile = <span class="hljs-keyword">new</span> <span class="hljs-title class_">SyncHook</span>([<span class="hljs-string">&#x27;params&#x27;</span>]);
compile.<span class="hljs-title function_">tap</span>(<span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-function">() =&gt;</span> logs.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;compile A&#x27;</span>));
compile.<span class="hljs-title function_">tap</span>(<span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-function">() =&gt;</span> logs.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;compile B&#x27;</span>));
compile.<span class="hljs-title function_">call</span>({});

<span class="hljs-keyword">const</span> emit = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AsyncSeriesHook</span>([<span class="hljs-string">&#x27;compilation&#x27;</span>]);
emit.<span class="hljs-title function_">tapPromise</span>(<span class="hljs-string">&#x27;Slow&#x27;</span>, <span class="hljs-function">() =&gt;</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> logs.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;emit Slow&#x27;</span>)));
emit.<span class="hljs-title function_">tapAsync</span>(<span class="hljs-string">&#x27;Callback&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">compilation, callback</span>) =&gt;</span> {
  logs.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;emit Callback&#x27;</span>);
  <span class="hljs-title function_">callback</span>();
});
emit.<span class="hljs-title function_">tap</span>(<span class="hljs-string">&#x27;Sync&#x27;</span>, <span class="hljs-function">() =&gt;</span> logs.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;emit Sync&#x27;</span>));

emit.<span class="hljs-title function_">promise</span>({}).<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(logs.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; / &#x27;</span>)); <span class="hljs-comment">// compile A / compile B / emit Slow / emit Callback / emit Sync</span>
});
</code></pre></div>
<p><code>Slow</code> 的回调要等一个微任务才写日志，可 <code>Callback</code> 和 <code>Sync</code> 仍然排在它后面。这就是 AsyncSeries 的含义：前一个回调的 Promise 完成、或者调用了 callback，才会开始下一个。如果换成 AsyncParallel，三个回调会同时开始，<code>Callback</code> 和 <code>Sync</code> 就可能先写日志。</p>
<p>为什么同步钩子只有 <code>tap</code>？Tapable README 说明，同步钩子只能用 <code>tap</code> 注册，因为 <code>call</code> 是同步返回的，没法等异步回调完成。异步钩子三种方法都支持，同步的 <code>tap</code> 回调在里面也照样能用。</p>
<h2>Bail、Waterfall 和 Loop</h2>
<p>这三种只改变“回调的返回值有什么用”，可以和 Sync、AsyncSeries 组合。Bail 是有一个回调返回了非 <code>undefined</code> 的值，就停下来不再执行后面的；webpack 的 <code>shouldEmit</code> 就是 SyncBailHook，返回 <code>false</code> 可以阻止输出文件。Waterfall 把每个回调的返回值传给下一个回调，适合层层加工同一个值。Loop 是某个回调返回非 <code>undefined</code> 时，从第一个回调重新开始，直到所有回调都返回 <code>undefined</code>。</p>
<h2>常见追问</h2>
<p><strong>compiler 和 compilation 的钩子怎么区分该用哪个？</strong></p>
<blockquote>
<p>跟整个构建生命周期有关的，比如开始、结束、写文件，在 compiler 上；跟这一次构建的模块、chunk、产物有关的，在 compilation 上。要用 compilation 的钩子，通常先在 compiler 的 <code>thisCompilation</code> 或 <code>compilation</code> 钩子里拿到 compilation 对象，再在它上面注册。</p>
</blockquote>
<p><strong><code>tap</code> 的第一个参数为什么必须传名字？</strong></p>
<blockquote>
<p>Tapable README 写明，注册时必须传入一个名字来标识插件。它用于调试和排序，比如别的插件可以通过 <code>before</code> 指定排在某个名字之前。</p>
</blockquote>`};export{e as default};