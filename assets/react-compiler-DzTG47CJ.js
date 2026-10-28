var e={answerHtml:`<h2>简答</h2>
<p>React Compiler 是一个构建期 Babel 插件，自动为组件和 Hook 插入记忆化，效果相当于自动写 memo、useMemo、useCallback。前提是代码遵守 React 规则，违反规则的组件会被跳过。它不是运行时开关，要接入构建链才生效。它只减少重复渲染计算，网络、布局和状态设计问题仍要单独处理。</p>
<p>普通 React 代码在父级更新时，可能重复执行筛选、构造对象、创建回调或重新计算子树。以前常用 useMemo、useCallback、memo 手工表达哪些结果可以复用；React Compiler 则尝试在构建时从代码的数据依赖中自动生成适用的记忆化。</p>
<p>它需要真正进入编译链。仅仅安装 React 19、升级 react-dom 或在文件里随手写一句指令，不代表源码已经被 Compiler 处理。</p>
<h2>不用手写缓存，也能让编译器分析依赖</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">OrderSummary</span>(<span class="hljs-params">{ items, currency }</span>) {
  <span class="hljs-keyword">const</span> total = items.<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">sum, item</span>) =&gt;</span> sum + item.<span class="hljs-property">price</span> * item.<span class="hljs-property">quantity</span>, <span class="hljs-number">0</span>);
  <span class="hljs-keyword">const</span> formatter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;currency&#x27;</span>, currency });
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>合计：{formatter.format(total)}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Cart</span>(<span class="hljs-params">{ items }</span>) {
  <span class="hljs-keyword">const</span> [note, setNote] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">OrderSummary</span> <span class="hljs-attr">items</span>=<span class="hljs-string">{items}</span> <span class="hljs-attr">currency</span>=<span class="hljs-string">&quot;CNY&quot;</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>备注<span class="hljs-tag">&lt;<span class="hljs-name">textarea</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{note}</span> <span class="hljs-attr">onChange</span>=<span class="hljs-string">{event</span> =&gt;</span> setNote(event.target.value)} /&gt;<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>源码里没有 memo、useMemo。输入备注只改变 note；编译后，<code>OrderSummary</code> 的 JSX 依赖的是 items 和 currency，这两者没变时，编译器生成的缓存可以直接复用上次的元素，求和与 formatter 的创建也会跳过。手写版本需要用 memo 包住子组件，并对 total、formatter 分别写 useMemo。</p>
<p>这个小列表用于说明依赖关系，不是一个性能基准。是否产生用户可感知收益，需要结合实际数据规模与渲染成本测量。</p>
<h2>它生成缓存逻辑，不改变状态的业务含义</h2>
<p>Compiler 分析组件和 Hook 中的数据流，在合适位置生成缓存读取与更新代码。它可能减少局部计算、稳定引用或复用子树，目标与一些手工记忆化有重叠，但不必逐行对应某个 useMemo 调用。</p>
<p>优化仍需要保持输入与行为的正确关系。状态 setter 的快照语义、Effect 清理、列表 key 和请求身份不会因此被重新定义。一个本来就错误的闭包或可变共享状态，不应指望 Compiler 自动修复。</p>
<p>记忆化也通常有自己的实例和生命周期边界，不是把所有用户、所有页面的相同计算塞进一个永久全局缓存。</p>
<h2>代码纯度与 React 规则是分析前提</h2>
<p>渲染中修改 props、共享对象或外部状态，会让“相同输入能否复用结果”的假设失效。条件调用常规 Hook、依赖不准确以及不兼容的库模式，也可能导致诊断或某些函数无法被优化。</p>
<p>这不表示每个问题都会让整个构建立即失败。有些情况下编译器会跳过不适合的部分，保留其余可优化代码。因此构建成功与“目标组件已经成功优化”是两份不同证据。</p>
<p>应处理 lint 规则和编译诊断，理解为什么被跳过，而不是为了提高一个表面上的覆盖率就隐藏警告。</p>
<h2>接入方式取决于当前构建工具版本</h2>
<p>React Compiler 以 Babel 插件 <code>babel-plugin-react-compiler</code> 发布，官方要求它在 Babel 插件链中<strong>最先</strong>运行。配套的 lint 规则已并入 eslint-plugin-react-hooks 的 <code>recommended-latest</code> 预设，会标出违反 React 规则、因而会被编译器跳过的组件。</p>
<p>@vitejs/plugin-react 6 移除了内联的 <code>babel</code> 选项，改为导出 <code>reactCompilerPreset</code>，与 @rolldown/plugin-babel 配合使用（低于 6 的版本仍写 <code>react({ babel: { plugins: [...] } })</code>）。安装 <code>babel-plugin-react-compiler</code> 和 <code>@rolldown/plugin-babel</code> 后：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// vite.config.js</span>
<span class="hljs-keyword">import</span> { defineConfig } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vite&#x27;</span>;
<span class="hljs-keyword">import</span> react, { reactCompilerPreset } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@vitejs/plugin-react&#x27;</span>;
<span class="hljs-keyword">import</span> babel <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@rolldown/plugin-babel&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">defineConfig</span>({
  <span class="hljs-attr">plugins</span>: [
    <span class="hljs-title function_">react</span>(),
    <span class="hljs-title function_">babel</span>({ <span class="hljs-attr">presets</span>: [<span class="hljs-title function_">reactCompilerPreset</span>()] }),
  ],
});
</code></pre></div>
<p>旧版本插件的内联 Babel 配置方式不一定能直接搬到新版本。使用 Next.js、其他框架或不同打包工具时，也应采用它们当前支持的接入方式，而不是把这段 Vite 配置复制到任意项目。</p>
<p>编译目标还需要与 React 运行时匹配。面向 React 17、18 等版本时，可能需要对应 target 与额外运行时包；不能让产物依赖目标环境没有的缓存运行时接口。</p>
<h2>use memo 与 use no memo 是编译指令，不是 Hook</h2>
<p>在配置下，&#x27;use memo&#x27; 可以标记需要优化的函数，尤其适合 annotation 模式；常见 infer 模式会按组件和 Hook 的命名及结构进行识别，并不要求所有组件都加这句话。</p>
<p>&#x27;use no memo&#x27; 可以在需要时局部退出相关编译优化。它应当用于有原因的排查或兼容处理，而不是作为解决不纯代码的永久替代。</p>
<p>这些字符串只有被编译器解释才有效，不会在浏览器里自动启动缓存。命名错误、构建插件没有运行或被排除的文件，也不应靠随意添加指令来猜测修复。</p>
<h2>已有手工 memoization 不要盲目删除</h2>
<p>接入后，很多原来需要手工维护的缓存可能不再必要，但应先确认编译覆盖和真实行为，再逐步简化。依赖某份稳定身份才能正确管理资源的代码，本来就应有清楚生命周期设计，不能只靠某个缓存永远不被丢弃来维持正确性。</p>
<p>编译器对已有 useMemo、useCallback 等信息也有处理与诊断规则。升级时大量机械删除，可能同时掩盖原先的依赖问题与新的兼容问题，最好按可验证的组件边界逐步迁移。</p>
<h2>它不能替代其他性能工作</h2>
<p>图片太大、网络瀑布、首屏脚本过重、DOM 数量过多、布局抖动或一段必须执行的昂贵计算，仍然需要对应优化。Compiler 主要减少不必要的重复工作，不会自动给每个请求做缓存、给列表做虚拟化，或把同步循环搬进 Worker。</p>
<p>验证时先确认目标文件确实经过编译，再检查产物或诊断中是否有预期优化，最后比较用户交互延迟与 Profiler、浏览器性能数据。只看到插件在 package.json 中，或者某个示例日志变少，都不足以证明整个平台已经更快。</p>
<p>补充参考：<a href="https://react.dev/learn/react-compiler/installation">React Compiler 安装</a>、<a href="https://react.dev/reference/react-compiler/directives/use-memo">use memo 指令</a>。</p>`};export{e as default};