var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>插件系统的核心是一份稳定的契约：插件说明自己是谁、需要哪些能力、往哪些扩展点加东西。编辑器的状态栏、后台的菜单，都是这样的扩展点。</p>
<p>宿主不让插件直接碰自己的内部状态，而是把插件需要的能力打包成一个 API 对象传给它，这叫能力注入。插件能做什么，完全看这个对象里给了什么。</p>
<p>生命周期至少要有激活和停用两步。插件注册的监听器、定时器，停用时必须由宿主统一清理，不能指望插件自觉。契约还要带版本号，宿主按版本判断兼容不兼容，废弃的 API 先警告、再移除。</p>
<p>要注意安全边界。同进程运行的插件等于拥有整个页面的权限，只适合受信任的插件。不可信的第三方插件要放进 iframe 或 Worker 里隔离。</p>
</blockquote>
<h2>一个插件长什么样</h2>
<p>下面是一个统计字数的插件，它在状态栏加一项，编辑器内容变了就更新字数：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> {
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;word-count&#x27;</span>,
  <span class="hljs-attr">apiVersion</span>: <span class="hljs-number">1</span>,
  <span class="hljs-title function_">activate</span>(<span class="hljs-params">api</span>) {
    <span class="hljs-keyword">const</span> item = api.<span class="hljs-property">statusBar</span>.<span class="hljs-title function_">add</span>({ <span class="hljs-attr">text</span>: <span class="hljs-string">&#x27;0 字&#x27;</span> });
    <span class="hljs-keyword">const</span> off = api.<span class="hljs-property">editor</span>.<span class="hljs-title function_">onChange</span>(<span class="hljs-function">(<span class="hljs-params">text</span>) =&gt;</span> {
      item.<span class="hljs-title function_">setText</span>(<span class="hljs-string">\`<span class="hljs-subst">\${text.length}</span> 字\`</span>);
    });
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
      <span class="hljs-title function_">off</span>();
      item.<span class="hljs-title function_">remove</span>();
    };
  },
};
</code></pre></div>
<p>插件只用到了 <code>api</code> 里给它的两样东西：状态栏和编辑器的变化通知。它碰不到宿主的其他部分。<code>activate</code> 返回的函数是清理函数，停用插件时调用。</p>
<h2>宿主要怎样实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">loadPlugin</span>(<span class="hljs-params">plugin, host</span>) {
  <span class="hljs-keyword">if</span> (plugin.<span class="hljs-property">apiVersion</span> !== <span class="hljs-number">1</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`不支持的 API 版本：<span class="hljs-subst">\${plugin.apiVersion}</span>\`</span>);

  <span class="hljs-keyword">const</span> disposers = [];
  <span class="hljs-keyword">const</span> api = {
    <span class="hljs-attr">editor</span>: {
      <span class="hljs-title function_">onChange</span>(<span class="hljs-params">fn</span>) {
        <span class="hljs-keyword">const</span> off = host.<span class="hljs-property">editor</span>.<span class="hljs-title function_">subscribe</span>(<span class="hljs-title function_">safe</span>(fn, plugin.<span class="hljs-property">name</span>));
        disposers.<span class="hljs-title function_">push</span>(off);
        <span class="hljs-keyword">return</span> off;
      },
    },
    <span class="hljs-attr">statusBar</span>: {
      <span class="hljs-title function_">add</span>(<span class="hljs-params">options</span>) {
        <span class="hljs-keyword">const</span> item = host.<span class="hljs-property">statusBar</span>.<span class="hljs-title function_">create</span>(options);
        disposers.<span class="hljs-title function_">push</span>(<span class="hljs-function">() =&gt;</span> item.<span class="hljs-title function_">remove</span>());
        <span class="hljs-keyword">return</span> item;
      },
    },
  };

  <span class="hljs-keyword">const</span> cleanup = plugin.<span class="hljs-title function_">activate</span>(api);
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    cleanup?.();
    disposers.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">dispose</span>) =&gt;</span> <span class="hljs-title function_">dispose</span>());
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">safe</span>(<span class="hljs-params">fn, name</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-function">(<span class="hljs-params">...args</span>) =&gt;</span> {
    <span class="hljs-keyword">try</span> {
      <span class="hljs-title function_">fn</span>(...args);
    } <span class="hljs-keyword">catch</span> (error) {
      <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(<span class="hljs-string">\`插件 <span class="hljs-subst">\${name}</span> 出错\`</span>, error);
    }
  };
}
</code></pre></div>
<p>你可能会问，插件不是已经返回了清理函数吗，宿主为什么还要自己记一份 <code>disposers</code>？因为插件可能忘了清理，也可能清理得不完整。宿主把插件通过 API 注册的每一样资源都记下来，停用时统一回收，就不会有漏掉的监听器一直挂着。</p>
<p>插件的回调都用 <code>safe</code> 包了一层错误捕获。这样一个插件出错，只会打一条日志，不会把编辑器和别的插件一起带崩。</p>
<p>API 对象也只暴露最小的能力，比如只读的文档内容和受控的修改方法。给得越少，插件能造成的破坏越小，宿主以后改内部实现也越自由。</p>
<h2>插件多了怎样不拖慢启动</h2>
<p>VS Code 这类成熟系统，让插件在清单文件里静态声明扩展点，比如命令、菜单、视图，以及什么时候激活。宿主不用加载插件代码，就能把菜单项显示出来，等用户第一次用到时才真正激活插件。这叫懒激活，插件一多，能明显缩短启动时间。</p>
<h2>版本怎样保持兼容</h2>
<p>宿主的 API 只增不改。需要改变行为时就新增一个 API，旧的标记废弃，在开发模式下打警告。</p>
<p>插件要声明自己兼容哪个范围的宿主版本，宿主遇到不兼容的插件就拒绝加载，并说明原因。宿主再提供一个 TypeScript 类型声明包，插件作者在编译时就能发现不兼容的用法。</p>
<h2>不可信的插件怎样隔离</h2>
<p>同进程运行的插件能访问 <code>window</code>、DOM 和 Cookie，等于拥有页面的全部权限。所以第三方插件应该放到隔离环境里运行。</p>
<p>一种是沙箱 iframe，带 <code>sandbox</code> 属性并且和宿主不同源。它可以渲染界面，通过 <code>postMessage</code> 和宿主通信。另一种是 Web Worker，它没有 DOM，适合纯计算或数据处理类的插件。</p>
<p>不管哪种，宿主都要在消息边界上校验来源和消息格式，只执行白名单里的操作。</p>
<h2>常见追问</h2>
<p><strong>插件之间怎么通信？</strong></p>
<blockquote>
<p>通过宿主提供的事件或服务注册机制，插件之间不直接互相导入。</p>
</blockquote>
<p><strong>怎样避免插件拖慢宿主？</strong></p>
<blockquote>
<p>限制同步回调的执行时间，耗时的操作要求放进 Worker 或者异步执行，再提供性能统计，帮助定位是哪个插件慢。</p>
</blockquote>`};export{e as default};