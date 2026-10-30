var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>三种模式都在回答同一个问题：界面代码和业务数据怎样分开，用户点了按钮以后谁来处理、界面怎样更新。它们都有 Model（业务数据和规则）和 View（界面），区别在中间那一层。</p>
<p>MVC 的中间层是 Controller。按 Microsoft 对 ASP.NET Core MVC 的说明，请求先到 Controller，它操作 Model，再选出要显示的 View，并把数据交给它。MVP 的中间层是 Presenter。Martin Fowler 的描述是，View 上的控件只把用户操作转给 Presenter，由 Presenter 决定怎么反应、去改 Model；在 Passive View 这个变体里，连界面上控件的值都由 Presenter 去设置。MVVM 的中间层是 ViewModel，它暴露属性和命令，View 通过数据绑定显示属性、调用命令，属性变化时发出通知，界面自动更新。Microsoft 的 MVVM 文档特别强调，ViewModel 不知道 View 的存在。</p>
<p>落到前端框架上，Vue 2 官方文档的原话是：Vue 没有严格对应 MVVM，但设计上部分受到它的启发，所以习惯用 <code>vm</code> 指代 Vue 实例。React 官方文档没有用这些模式来介绍自己，它讲的是单向数据流，数据从父组件经 props 往下传，子组件通过父组件传下来的回调改状态。</p>
<p>要注意，Fowler 说 MVC 是被误解最多的架构模式之一，不同人从不同地方读到的 MVC 并不一样。所以回答时最好说清楚依据的是哪一种描述，不要把某个框架硬说成“就是某某模式”。</p>
</blockquote>
<h2>三种模式的共同点</h2>
<p>先说它们共同的出发点。Microsoft 在 MVVM 文档开头描述了要解决的问题：界面控件和业务逻辑写在一起，改界面的成本高，也很难做单元测试。ASP.NET Core MVC 文档举的例子更具体：界面逻辑比业务逻辑变得更频繁，如果两者混在一个对象里，每改一次界面都要动包含业务逻辑的代码，还要重新测试业务逻辑。</p>
<p>所以三种模式都把 Model 单独拿出来。Model 表示应用的数据和业务规则，不依赖界面，可以独立测试。差别都在 View 和 Model 之间的那一层。</p>
<h2>MVC：Controller 接收输入、选择 View</h2>
<p>ASP.NET Core MVC 文档对三者的分工是这样写的：用户请求被路由到 Controller；Controller 负责和 Model 一起完成用户的操作或查询，然后选择要显示的 View，并把需要的 Model 数据交给它；View 只负责展示，里面的逻辑应该只和展示内容有关。</p>
<p>依赖方向也写得很清楚：View 和 Controller 都依赖 Model，Model 不依赖 View 也不依赖 Controller。这让 Model 可以脱离界面单独构建和测试。</p>
<p>这是服务端 Web 框架里常见的 MVC。Fowler 介绍的早期桌面 MVC 还有一套 View 通过观察者模式监听 Model 变化的做法，两者并不完全一样，这也是他说 MVC 经常被误解的原因。</p>
<h2>MVP：Presenter 接管用户操作</h2>
<p>Fowler 对 MVP 的描述是：View 只是一组控件，控件上虽然有事件处理函数，但这些函数只是把控制权交给 Presenter；Presenter 决定怎么响应，去修改 Model。</p>
<p>和 MVC 比，Fowler 指出了两点不同。一是不再把控件拆成 View 和 Controller 两部分；二是 Presenter 通常以整张表单为单位，而不是以单个控件为单位，他认为这一点可能是更大的区别。</p>
<p>MVP 还有两种常见变体。Supervising Controller 里，能用声明方式描述的界面逻辑留在 View，复杂的情况交给 Presenter。Passive View 里，Presenter 负责操作所有控件，View 完全被动。Fowler 提到，Passive View 不在 MVP 最初的描述里，是后来人们为了方便测试发展出来的：View 什么逻辑都没有，测 Presenter 时用一个假的 View 就够了。</p>
<h2>MVVM：ViewModel 暴露状态，View 自动绑定</h2>
<p>Microsoft 的 MVVM 文档对三者的定义是：View 定义用户在屏幕上看到的结构、布局和外观；ViewModel 实现 View 可以绑定的属性和命令，并通过变更通知事件告诉 View 状态变了；Model 是不可见的类，封装应用的数据和业务、校验逻辑。</p>
<p>关键在依赖方向。文档的原话是，View “知道” ViewModel，ViewModel “知道” Model，但 Model 不知道 ViewModel，ViewModel 也不知道 View。文档还专门提醒，ViewModel 里不要引用按钮、列表这些 View 里的类型，这样 ViewModel 才能单独测试。</p>
<p>这和 MVP 的 Passive View 正好相反。Passive View 里 Presenter 主动去设置控件，Presenter 必须拿着 View 的引用；MVVM 里 ViewModel 只管改自己的属性、发出通知，至于界面怎么更新，交给数据绑定去做。</p>
<h2>用一段代码对比 MVP 和 MVVM</h2>
<p>下面用纯 JavaScript 模拟一个计数器，不依赖任何框架。先看 MVP：Presenter 拿着 View 的引用，自己调用 <code>view.render()</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> model = { <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> };

<span class="hljs-keyword">const</span> fakeView = {
  <span class="hljs-attr">text</span>: <span class="hljs-string">&#x27;&#x27;</span>,
  <span class="hljs-title function_">render</span>(<span class="hljs-params">value</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">text</span> = <span class="hljs-string">&#x27;当前 &#x27;</span> + value;
  },
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">createPresenter</span>(<span class="hljs-params">view, data</span>) {
  <span class="hljs-keyword">return</span> {
    <span class="hljs-title function_">onIncrement</span>(<span class="hljs-params"></span>) {
      data.<span class="hljs-property">count</span> += <span class="hljs-number">1</span>;
      view.<span class="hljs-title function_">render</span>(data.<span class="hljs-property">count</span>);
    },
  };
}

<span class="hljs-keyword">const</span> presenter = <span class="hljs-title function_">createPresenter</span>(fakeView, model);
presenter.<span class="hljs-title function_">onIncrement</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(fakeView.<span class="hljs-property">text</span>); <span class="hljs-comment">// 当前 1</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">createViewModel</span>(<span class="hljs-params">data</span>) {
  <span class="hljs-keyword">const</span> listeners = [];
  <span class="hljs-keyword">return</span> {
    <span class="hljs-keyword">get</span> <span class="hljs-title function_">count</span>() {
      <span class="hljs-keyword">return</span> data.<span class="hljs-property">count</span>;
    },
    <span class="hljs-title function_">increment</span>(<span class="hljs-params"></span>) {
      data.<span class="hljs-property">count</span> += <span class="hljs-number">1</span>;
      listeners.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">notify</span>) =&gt;</span> <span class="hljs-title function_">notify</span>(<span class="hljs-string">&#x27;count&#x27;</span>));
    },
    <span class="hljs-title function_">onPropertyChanged</span>(<span class="hljs-params">listener</span>) {
      listeners.<span class="hljs-title function_">push</span>(listener);
    },
  };
}

<span class="hljs-keyword">const</span> viewModel = <span class="hljs-title function_">createViewModel</span>({ <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> });
<span class="hljs-keyword">let</span> boundText = <span class="hljs-string">&#x27;&#x27;</span>;
viewModel.<span class="hljs-title function_">onPropertyChanged</span>(<span class="hljs-function">() =&gt;</span> {
  boundText = <span class="hljs-string">&#x27;当前 &#x27;</span> + viewModel.<span class="hljs-property">count</span>;
});
viewModel.<span class="hljs-title function_">increment</span>();
viewModel.<span class="hljs-title function_">increment</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(boundText); <span class="hljs-comment">// 当前 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(viewModel.<span class="hljs-property">count</span>); <span class="hljs-comment">// 2</span>
</code></pre></div>
<p>两段代码做的事情一样，区别在于谁去更新界面。MVP 里，Presenter 改完数据以后亲自调用 <code>view.render()</code>，所以测试 Presenter 时要传一个假的 View 进去，像这里的 <code>fakeView</code>。</p>
<p>MVVM 里，<code>createViewModel</code> 根本没有 View 参数。它只改数据，再通知“<code>count</code> 变了”；是外面的绑定代码（这里用 <code>onPropertyChanged</code> 模拟）订阅通知、更新 <code>boundText</code>。测试 ViewModel 时直接调用 <code>increment()</code>、读 <code>count</code> 就行，不需要任何界面。真实的 MVVM 框架里，这段绑定代码由框架提供，开发者在模板里声明“这里显示 <code>count</code>”。</p>
<h2>前端框架更接近哪一种</h2>
<p>先说 Vue。Vue 2 官方文档写的是：Vue 虽然没有严格遵循 MVVM 模式，但设计上部分受到了它的启发，并且习惯用变量 <code>vm</code>（ViewModel 的缩写）指代 Vue 实例。也就是说，组件实例大致扮演 ViewModel，模板是 View，模板里的绑定由框架负责。具体怎样对应，以及 Vue 3 文档为什么不再用 MVVM 来介绍，见<a href="/questions/vue-mvvm/">《MVVM 是什么？Vue 是怎样体现 MVVM 的？》</a>。</p>
<p>再说 React。React 官方文档没有说自己属于哪种模式。Thinking in React 一文讲的是单向数据流：数据从顶层组件经 props 一层层传到下面；子组件想改数据，要调用父组件传下来的回调。文档还说，这种写法让数据流向更清楚，但比双向数据绑定多写一点代码。所以 React 不提供 MVVM 那种 View 和 ViewModel 之间的双向绑定，不适合直接套用 MVVM 的说法。</p>
<p>因此比较稳妥的回答是：Vue 官方承认受 MVVM 启发；React 官方用单向数据流描述自己；至于“React 是 MVC 里的 V”这类说法，React 官方文档里没有，不要当成定论去讲。</p>
<h2>常见追问</h2>
<p><strong>MVVM 一定是双向绑定吗？</strong></p>
<blockquote>
<p>Microsoft 的 MVVM 文档描述的是 ViewModel 发出属性变更通知、View 通过数据绑定更新，并说 ViewModel 要参与双向绑定，属性就必须发出 <code>PropertyChanged</code> 事件。所以双向绑定是 MVVM 里常见的能力，但模式的核心是“ViewModel 不知道 View，靠绑定同步”。Vue 里既有单向的 <code>v-bind</code>，也有双向的 <code>v-model</code>。</p>
</blockquote>
<p><strong>MVP 和 MVVM 哪个更好测试？</strong></p>
<blockquote>
<p>两者都把逻辑从 View 里移了出来，都比把逻辑写在界面里好测。区别是 MVP 的 Presenter 要拿着 View 的引用，测试时要准备一个假的 View；MVVM 的 ViewModel 不引用 View，Microsoft 的文档把“可以不用 View 就为 ViewModel 和 Model 写单元测试”列为 MVVM 的好处之一。</p>
</blockquote>
<p><strong>为什么说 MVC 是最容易被误解的模式？</strong></p>
<blockquote>
<p>Fowler 的原话是，不同的人从不同地方读到 MVC，各自得到不同的理解，都叫它 MVC。比如早期桌面 GUI 里的 MVC 和 ASP.NET Core MVC 这类服务端框架里的 MVC 分工就不一样。所以讨论时先说清楚指的是哪一种。</p>
</blockquote>`};export{e as default};