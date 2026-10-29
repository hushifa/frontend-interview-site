var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>React Native 就是用写 React 的方式做手机 App。组件、props、state、Hooks、Context 这些概念完全一样，状态管理和数据请求的库大多也能直接用。</p>
<p>不同的地方在渲染。浏览器里的 React 渲染成 DOM，React Native 渲染成 iOS、Android 的原生视图。所以没有 <code>div</code>、<code>span</code>，也没有浏览器 API，要用 <code>View</code>、<code>Text</code>、<code>Image</code> 这些组件，文字必须放在 <code>Text</code> 里。</p>
<p>样式也不一样。它用 JS 对象写样式，没有选择器，也没有样式继承，<code>Text</code> 嵌套是例外。布局默认是 Flexbox，而且 <code>flexDirection</code> 默认是 <code>column</code>，也就是纵向排列。</p>
<p>另外，长列表要用 <code>FlatList</code> 按需渲染；导航、手势、动画通常要靠 React Navigation、Reanimated 这类社区库。</p>
</blockquote>
<h2>同一个组件两边怎么写</h2>
<p>下面是同一张卡片，先看 Web 版：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// Web</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Card</span>(<span class="hljs-params">{ title, onPress }</span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">className</span>=<span class="hljs-string">&quot;card&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{onPress}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">h2</span>&gt;</span>{title}<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>再看 React Native 版：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// React Native</span>
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Pressable</span>, <span class="hljs-title class_">Text</span>, <span class="hljs-title class_">StyleSheet</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-native&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Card</span>(<span class="hljs-params">{ title, onPress }</span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Pressable</span> <span class="hljs-attr">style</span>=<span class="hljs-string">{styles.card}</span> <span class="hljs-attr">onPress</span>=<span class="hljs-string">{onPress}</span> <span class="hljs-attr">accessibilityRole</span>=<span class="hljs-string">&quot;button&quot;</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Text</span> <span class="hljs-attr">style</span>=<span class="hljs-string">{styles.title}</span>&gt;</span>{title}<span class="hljs-tag">&lt;/<span class="hljs-name">Text</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">Pressable</span>&gt;</span></span>
  );
}

<span class="hljs-keyword">const</span> styles = <span class="hljs-title class_">StyleSheet</span>.<span class="hljs-title function_">create</span>({
  <span class="hljs-attr">card</span>: { <span class="hljs-attr">padding</span>: <span class="hljs-number">16</span>, <span class="hljs-attr">borderRadius</span>: <span class="hljs-number">8</span>, <span class="hljs-attr">backgroundColor</span>: <span class="hljs-string">&#x27;#fff&#x27;</span> },
  <span class="hljs-attr">title</span>: { <span class="hljs-attr">fontSize</span>: <span class="hljs-number">18</span>, <span class="hljs-attr">fontWeight</span>: <span class="hljs-string">&#x27;600&#x27;</span> },
});
</code></pre></div>
<p>组件的逻辑没变，接收 <code>title</code> 和点击回调。可是标签换成了 <code>Pressable</code> 和 <code>Text</code>，事件从 <code>onClick</code> 变成 <code>onPress</code>，样式从 class 变成 JS 对象，按钮语义要用 <code>accessibilityRole</code> 自己声明。</p>
<h2>两边具体差在哪里</h2>
<table><thead><tr><th></th><th>React DOM</th><th>React Native</th></tr></thead><tbody><tr><td>渲染目标</td><td>浏览器 DOM</td><td>原生视图（UIView、android.view.View）</td></tr><tr><td>基础元素</td><td><code>div</code>、<code>span</code>、<code>img</code></td><td><code>View</code>、<code>Text</code>、<code>Image</code></td></tr><tr><td>样式</td><td>CSS，选择器和层叠</td><td>JS 对象，无选择器，无层叠</td></tr><tr><td>布局默认</td><td>块级流式布局</td><td>Flexbox，纵向排列</td></tr><tr><td>尺寸单位</td><td>px、rem、% 等</td><td>无单位数字（密度无关像素）和 %</td></tr><tr><td>事件</td><td><code>onClick</code>、DOM 事件</td><td><code>onPress</code>、手势响应系统</td></tr><tr><td>平台 API</td><td>Web API</td><td>原生模块</td></tr><tr><td>发布</td><td>部署即更新</td><td>应用商店审核；JS 部分可借助 OTA 方案更新</td></tr></tbody></table>
<p>表里最后一行容易被忽略。网页部署完用户刷新就是新版本，App 却要过应用商店审核。所以有了 OTA 方案，意思是不发新包，只把 JS 部分从网络上更新下来。</p>
<h2>长列表为什么要用 FlatList</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx">&lt;<span class="hljs-title class_">FlatList</span>
  data={items}
  keyExtractor={<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">id</span>}
  renderItem={<span class="hljs-function">(<span class="hljs-params">{ item }</span>) =&gt;</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Card</span> <span class="hljs-attr">title</span>=<span class="hljs-string">{item.title}</span> /&gt;</span></span>}
/&gt;
</code></pre></div>
<p><code>FlatList</code> 只渲染屏幕可见区域附近的条目。<code>ScrollView</code> 会把所有子元素一次性渲染出来。所以长列表如果用 <code>ScrollView</code>，内存占用会很大，应该改用 <code>FlatList</code>。</p>
<h2>iOS 和 Android 不一样怎么办</h2>
<p>同一个组件在两个平台上，外观或行为可能不同，比如阴影属性、键盘遮挡、返回按钮。这时可以用 <code>Platform.OS</code> 判断平台，或者用 <code>.ios.js</code> / <code>.android.js</code> 文件后缀分别写两份实现。</p>
<h2>能和 Web 共享代码吗</h2>
<p>业务逻辑、请求层、状态管理可以放进一个共享包，两端一起用。</p>
<p>React Native for Web 还能把 RN 组件渲染到浏览器里，适合同时做移动端和 Web 的产品。不过 Web 端的 SEO 和语义化要额外操心。</p>
<p>新架构的原理，比如 JSI、Fabric、TurboModules，见<a href="/questions/mobile-rn-bridge/">《React Native 原生桥接和新架构应该怎样理解？》</a>。</p>
<h2>常见追问</h2>
<p><strong>React Native 是 WebView 吗？</strong></p>
<blockquote>
<p>不是。界面是由原生视图组成的，JS 只负责描述界面长什么样和处理业务逻辑。</p>
</blockquote>
<p><strong>用 Expo 还是裸 React Native？</strong></p>
<blockquote>
<p>Expo 提供开箱即用的原生模块、构建和更新服务。React Native 官方文档也推荐用框架，比如 Expo，来开始新项目。</p>
</blockquote>`};export{e as default};