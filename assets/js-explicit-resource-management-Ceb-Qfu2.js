var e={answerHtml:`<h2>简答</h2>
<ul>
<li>using 声明在离开块作用域时自动调用资源的 Symbol.dispose，await using 调用并等待 Symbol.asyncDispose。</li>
<li>多个资源按声明的相反顺序释放。</li>
<li>释放与主逻辑都出错时，错误会包装成 SuppressedError。</li>
<li>DisposableStack 用于动态收集资源；使用前要确认目标运行时或编译器支持。</li>
</ul>
<p>打开读取器、获取锁或注册临时订阅后，即使业务代码提前 return 或抛错，也应执行释放。传统做法是在 try/finally 中明确清理；资源多时，容易漏掉某条退出路径，或把释放顺序写反。</p>
<p>using 与 await using 让对象声明自己的释放协议，并把释放安排到所在作用域结束时。它们管理的是“现在该结束这项资源使用”，不是等垃圾回收器以后发现对象不可达。</p>
<h2>using 在离开作用域时调用 Symbol.dispose</h2>
<p>下面的对象用日志模拟获取与释放，以便观察顺序，不持有真实文件或连接：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">resource</span>(<span class="hljs-params">name</span>) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`获取<span class="hljs-subst">\${name}</span>\`</span>);
  <span class="hljs-keyword">return</span> {
    [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">dispose</span>]() {
      <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`释放<span class="hljs-subst">\${name}</span>\`</span>);
    },
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">work</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">using</span> first = <span class="hljs-title function_">resource</span>(<span class="hljs-string">&#x27;A&#x27;</span>);
  <span class="hljs-keyword">using</span> second = <span class="hljs-title function_">resource</span>(<span class="hljs-string">&#x27;B&#x27;</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;执行工作&#x27;</span>);
}

<span class="hljs-title function_">work</span>();
<span class="hljs-comment">// 输出：获取A → 获取B → 执行工作 → 释放B → 释放A</span>
</code></pre></div>
<p>资源按相反的登记顺序释放，符合后获取的资源可能依赖先获取资源的情况。执行 return、抛错或正常走到作用域末尾，都会按控制流进入释放过程。</p>
<p>using 不会自动寻找一个名字叫 close、destroy 或 unsubscribe 的普通方法。对象必须提供符合协议的 Symbol.dispose，或通过适当包装接入；null、undefined 可表示没有需要释放的资源。</p>
<p>声明绑定不能重新赋值，也不能因为资源在函数结束时释放，就让那个对象的所有引用自动消失。对象是否拒绝释放后的继续使用，仍取决于自身实现。把 using 资源直接返回给外部时，要注意调用方拿到它之前可能已经执行了释放。</p>
<h2>await using 等待的是释放，不是自动等待获取</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">openResource</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> {
    <span class="hljs-keyword">async</span> [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">asyncDispose</span>]() {
      <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>();
      <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;异步释放完成&#x27;</span>);
    },
  };
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">work</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">await</span> <span class="hljs-keyword">using</span> resource = <span class="hljs-keyword">await</span> <span class="hljs-title function_">openResource</span>();
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;执行工作&#x27;</span>);
}

<span class="hljs-title function_">work</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;函数完成&#x27;</span>));
<span class="hljs-comment">// 输出：执行工作 → 异步释放完成 → 函数完成</span>
</code></pre></div>
<p>右边的 await 等待 openResource 取得资源；左边的 await using 表示离开作用域时等待异步释放。它们作用于两个不同阶段，不能因为写了 await using，就省略实际需要的获取阶段 await，把一个普通 Promise 误当成可释放资源。</p>
<p>await using 需要处于允许 await 的上下文，例如 async 函数或合适的模块位置。它优先使用异步释放协议，也可以按协议处理同步可释放资源；真正需要等待异步清理时，应正确实现 Symbol.asyncDispose，而不是把任意 Promise 塞进一个本来约定同步的释放方法。</p>
<p>同步 using 不会为 Symbol.dispose 返回的异步工作提供同样的等待承诺。释放操作的类型和声明方式必须匹配，否则函数可能已经结束，清理却还在后台运行或失败。</p>
<h2>工作和释放同时失败时会发生什么</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">fail</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">using</span> resource = {
    [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">dispose</span>]() {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;释放失败&#x27;</span>);
    },
  };
  <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;工作失败&#x27;</span>);
}

<span class="hljs-keyword">try</span> {
  <span class="hljs-title function_">fail</span>();
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// SuppressedError</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">error</span>.<span class="hljs-property">message</span>); <span class="hljs-comment">// 释放失败</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">suppressed</span>.<span class="hljs-property">message</span>); <span class="hljs-comment">// 工作失败</span>
}
</code></pre></div>
<p>SuppressedError 保留两个失败：error 是较晚发生的错误，suppressed 是此前被抑制的错误。它不等同于 AggregateError 的一组并列错误，也不等同于普通 finally 中一个新 throw 把原错误完全覆盖。</p>
<p>多个资源释放都失败时，还可能继续形成嵌套关系。某个释放动作失败，不应因此简单跳过剩余已登记资源的释放。诊断代码需要保留这条错误链，不能只上传最外层的通用消息而丢掉真实原因。</p>
<h2>资源个数和获取路径不固定时可以用释放栈</h2>
<p>DisposableStack 与 AsyncDisposableStack 用来管理动态登记的释放动作。use 接受协议资源，adopt 可以把普通值与自定义释放函数关联，defer 则登记不需要该值参数的清理回调。</p>
<p>它们适合在多个条件分支中逐步获得资源，并在后续步骤失败时统一按逆序清理。也可以结合 using 管理栈本身，或在不适合词法作用域的生命周期里显式调用释放方法。</p>
<p>但是作用域要与真实生命周期一致。组件创建函数返回后，组件可能还要继续存活很久；如果在创建函数内部用 using 立刻管理一条应持续到卸载的订阅，它会在函数返回时过早清理。此时应把所有权交给组件卸载逻辑，而不是为了使用新语法强行缩短资源寿命。</p>
<h2>兼容性需要同时检查语法与运行时 API</h2>
<p>有 Symbol.dispose 不代表解析器就一定认识 using，也不代表 DisposableStack、SuppressedError 等全部存在。比如某些运行时已有相关 Symbol，但原生解析 using 仍会报语法错误。</p>
<p>语法错误可能在任何分支执行前就发生，因此不能在同一份旧环境要解析的源码中，简单用一个 if 包住新语法来回退。需要合适的构建目标、语法转换或分发策略，同时确认转换产物依赖的运行时能力。</p>
<p>对不支持的环境，明确的 try/finally 仍然是可靠方案。转换后的错误合并、逆序释放与异步等待也应验证，不能只看类型检查通过就认为浏览器能够执行。</p>
<h2>它不提供抢占式中断或进程退出保障</h2>
<p>如果代码一直没有离开作用域，例如 await 的操作永远不完成，资源不会因为 using 声明存在就立刻释放。外部取消还需要连接 AbortSignal 或具体数据源的终止机制。</p>
<p>进程被强制结束、页面直接终止等情况，也不属于可以保证任意 JavaScript 清理完成的普通控制流。真正重要的外部状态仍需要适当的服务端期限、事务或恢复机制。</p>
<p>资源接口最好让释放动作可以安全处理重复调用，并明确释放后的行为。using 简化了谁在何时调用释放，但资源本身怎样正确关闭、怎样报告失败，仍然需要设计。</p>`};export{e as default};