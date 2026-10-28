var e={answerHtml:`<h2>简答</h2>
<ul>
<li>插件系统的核心是一份稳定的契约：插件声明自己是谁、需要什么能力、在哪些扩展点贡献内容。</li>
<li>宿主只把插件需要的能力通过 API 对象注入，插件不能直接访问宿主内部状态。</li>
<li>生命周期至少包括激活和停用，插件注册的监听器、定时器在停用时必须被宿主统一清理。</li>
<li>契约要有版本号，宿主按版本判断兼容性，废弃 API 先警告再移除。</li>
<li>运行不可信的第三方插件要放进 iframe 或 Worker 隔离；同进程运行只适合受信任的插件。</li>
</ul>
<h2>插件契约</h2>
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
<p>插件只能使用 <code>api</code> 中提供的能力，<code>activate</code> 返回的清理函数在停用时调用。</p>
<h2>宿主的实现要点</h2>
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
<ul>
<li>宿主记录插件注册的所有资源，即使插件忘了清理，停用时也能回收。</li>
<li>插件回调包一层错误捕获，一个插件出错不影响编辑器和其他插件。</li>
<li>API 对象只暴露最小能力，例如只读的文档内容和受控的修改方法。</li>
</ul>
<h2>扩展点和懒激活</h2>
<p>VS Code 等成熟系统让插件在清单中静态声明扩展点（命令、菜单、视图）和激活条件，宿主不加载代码也能显示菜单项，用户首次使用时才激活插件。插件多时，这能显著缩短启动时间。</p>
<h2>版本兼容</h2>
<ul>
<li>宿主 API 只增不改；需要改变行为时新增 API，旧 API 标记废弃并在开发模式下警告。</li>
<li>插件声明兼容的宿主版本范围，宿主拒绝加载不兼容的插件并提示原因。</li>
<li>为宿主 API 提供 TypeScript 类型声明包，插件作者在编译期就能发现不兼容。</li>
</ul>
<h2>隔离不可信插件</h2>
<p>同进程运行的插件可以访问 <code>window</code>、DOM 和 Cookie，等同于拥有页面全部权限。第三方插件应运行在：</p>
<ul>
<li><strong>沙箱 iframe</strong>（<code>sandbox</code> 属性，不同源）：可以渲染 UI，通过 <code>postMessage</code> 与宿主通信。</li>
<li><strong>Web Worker</strong>：没有 DOM，适合纯计算或数据处理类插件。</li>
</ul>
<p>宿主在消息边界上校验来源和消息格式，只执行白名单中的操作。</p>
<h2>常见追问</h2>
<ul>
<li>插件之间怎么通信？通过宿主提供的事件或服务注册机制，不直接互相导入。</li>
<li>怎样避免插件拖慢宿主？限制同步回调的执行时间，耗时操作要求放到 Worker 或异步执行，并提供性能统计帮助定位。</li>
</ul>`};export{e as default};