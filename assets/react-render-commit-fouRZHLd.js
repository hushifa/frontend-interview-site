var e={answerHtml:`<p>React 中的“渲染”经常被口头用来指代整个页面更新，但分析机制时应拆开看：先有更新触发，再调用组件计算 UI，最后把需要的变化提交给 DOM。浏览器还要根据这些变化安排样式、布局与绘制。</p>
<p>所以组件函数运行一次、DOM 改一次、屏幕画一帧，不是三个可以直接画等号的事件。</p>
<h3>渲染阶段先计算，而不是立即改完页面</h3>
<p>React 根据当前 props、state 和 context 调用组件，得到元素描述，再决定它们与上一份已提交结构之间的关系。这个阶段主要回答“下一份界面应该是什么”。</p>
<p>并发能力下，某些渲染工作可能被暂停、放弃或重新计算。不是每次开始计算的结果最后都会提交；不过也不能据此声称 React 可以在任意一行同步 JavaScript 中间强行抢占并恢复，它的调度仍有具体执行边界。</p>
<p>组件函数被调用的次数，因此不等于用户实际看见界面变化的次数。</p>
<h3>提交阶段把需要的变化应用到 DOM</h3>
<p>React 选择要提交的结果后，执行必要的 DOM 插入、更新、移除，以及相关 ref 和 Effect 阶段工作。它不会因为父组件重新执行，就无条件删除整棵 DOM 再重新创建。</p>
<p>下面的例子每次点击都会更新计数并重新计算组件，但输入框保持同样的类型与树中位置：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">RenderDemo</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [revision, setRevision] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;计算 UI：&#x27;</span>, revision);

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>
        草稿
        <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">defaultValue</span>=<span class="hljs-string">&quot;初稿&quot;</span> /&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>版本：{revision}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> setRevision(value =&gt; value + 1)}&gt;
        重新计算
      <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>先修改输入框中的文字，再点击按钮。版本文字需要更新，但 React 可以复用原输入 DOM，用户草稿不会因为组件函数再次调用就自动恢复成初稿。</p>
<p>defaultValue 负责非受控输入的初始值，不会在每次渲染时强制覆盖当前值。如果改变 key、切换组件类型或把输入真正卸载再挂载，身份关系改变，结果又会不同。</p>
<h3>纯渲染为什么是必要条件</h3>
<p>渲染中不应直接注册监听、发起普通副作用请求、修改外部缓存或更改传入对象。否则一次没有提交的试算也可能已经把外部世界改变了；重新计算又可能重复执行这些动作。</p>
<p>可以创建并修改本次渲染刚创建、尚未向外共享的局部对象，例如构造一个用于返回的数组。纯度要求的重点是不要在计算 UI 时改变已有外部状态，而不是完全禁止任何局部赋值。</p>
<p>示例中的 console.log 只用于观察计算过程，不应拿它来计费、统计一次有效曝光或推断提交次数。开发模式下的额外调用也会让这种观察更明显。</p>
<h3>用户动作和外部同步各有位置</h3>
<p>用户明确点击“提交”“购买”“删除”引发的业务动作，通常应在对应事件处理器中表达。Effect 则适合让已经提交的组件与外部系统保持同步，例如连接、订阅或定时器。</p>
<p>这样即使 UI 计算被重试，也不会无意重复业务操作。用户事件本身仍可能因重复点击发生多次，因此需要的防重、幂等和取消机制仍要按业务处理，不能只靠把代码移出 render 就认为全部完成。</p>
<p>根据现有状态计算列表、颜色或标签，通常可以直接在渲染中计算，不需要另一个 Effect 先把派生结果写进 state，再触发第二次更新。</p>
<h3>layout Effect、普通 Effect 与浏览器绘制不同步等价</h3>
<p>useLayoutEffect 在相关 DOM 已更新后、浏览器重新绘制之前执行，可用于必要的布局测量与同步视觉修正，但会阻塞绘制。它不适合无差别承载所有副作用。</p>
<p>useEffect 在提交之后运行，通常适合不需要阻塞绘制的外部同步。它不是严格意义上“永远在 paint 后”的回调，交互和更新调度可能改变相对时机。</p>
<p>浏览器绘制也不保证每次 React 提交之后马上发生。连续任务、主线程占用和刷新节奏都可能影响用户真正看到变化的时间，因此需要用浏览器性能工具观察完整路径。</p>
<h3>Strict Mode 的额外调用不代表生产页面重复提交</h3>
<p>开发环境 Strict Mode 会额外调用一些渲染或更新计算，并检查 Effect、ref 等相关清理流程，目的是暴露不纯行为和生命周期缺口。不同边界与版本下具体检查方式可能不同，不宜只背一个固定的“所有东西执行两次”。</p>
<p>如果删掉 Strict Mode 后现象消失，应先检查代码是否依赖了不安全的一次性假设，而不是直接认定它是 React 的错误。真正的提交行为、DOM 身份和清理配对，比日志条数更有诊断价值。</p>
<h3>性能排查应区分计算成本与实际变更</h3>
<p>一个组件重新渲染可能花很多时间，但最终几乎不改 DOM；另一个组件计算很简单，却提交了大量节点和昂贵布局。两种瓶颈需要不同优化。</p>
<p>可以结合 React Profiler 与浏览器 Performance，定位哪部分在计算、提交、布局或绘制。memo、状态下沉和减少派生重复工作主要影响某些计算路径；节点数量、布局结构和样式选择又影响宿主工作。先分清成本发生在哪个阶段，再决定怎样优化。</p>`};export{e as default};