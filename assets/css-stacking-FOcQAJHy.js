var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>可以把层叠上下文想成一个整体图层。里面的元素先在图层内部排好先后，然后整个图层作为一个整体，再和外面的兄弟比。</p>
<p>所以父元素 <code>z-index: 1</code>，旁边的元素 <code>z-index: 2</code>，子元素写 <code>z-index: 9999</code> 也只是在父元素里面最高，整体还是被盖住。</p>
<p>很多属性都会创建层叠上下文：定位元素加上不是 <code>auto</code> 的 <code>z-index</code>、<code>opacity</code> 小于 1、<code>transform</code>、<code>filter</code>、<code>isolation: isolate</code>、flex 或 grid 项目加 <code>z-index</code>、<code>position: fixed</code> 或 <code>sticky</code>。</p>
<p>另外两点要注意。<code>z-index</code> 只对定位元素、flex 项目和 grid 项目生效，普通的静态块写了也没用。还有，元素看起来被遮住，也可能是被祖先的 <code>overflow</code> 裁掉了，跟 z-index 没关系。</p>
</blockquote>
<h2>下拉菜单为什么被内容盖住</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">header</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;position: relative; z-index: 1&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;dropdown&quot;</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;position: absolute; z-index: 9999&quot;</span>&gt;</span>菜单<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">header</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">main</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;position: relative; z-index: 2&quot;</span>&gt;</span>内容<span class="hljs-tag">&lt;/<span class="hljs-name">main</span>&gt;</span>
</code></pre></div>
<p>菜单 <code>z-index: 9999</code>，<code>main</code> 只有 2，菜单却被 <code>main</code> 盖住了。</p>
<p>原因是 <code>header</code> 有定位又有 <code>z-index: 1</code>，它创建了一个层叠上下文，菜单被关在里面。<code>.dropdown</code> 和 <code>main</code> 根本不在同一个上下文里直接比。真正比的是 <code>header</code> 的 1 和 <code>main</code> 的 2，<code>header</code> 整体输了，里面的菜单再高也没用。</p>
<p>改法有三种。提高 <code>header</code> 的 <code>z-index</code>，让它整体排到 <code>main</code> 上面。或者去掉 <code>main</code> 不必要的 <code>z-index</code>，让它不再创建上下文。或者把下拉菜单渲染到更外层，或者改用 popover，它会进入顶层（top layer），排在所有层叠上下文之上。</p>
<h2>同一个上下文里，谁画在上面</h2>
<p>同一个层叠上下文里，从下往上依次是：上下文根元素的背景和边框，负 <code>z-index</code> 的子上下文，普通的块，浮动元素，行内内容，<code>z-index: auto</code> 或 0 的定位元素，最后是正 <code>z-index</code> 的子上下文。</p>
<p>所以没写 <code>z-index</code> 的定位元素，也会盖在普通块和浮动元素上面。</p>
<h2>遇到遮挡怎么排查</h2>
<p>从被遮住的元素往上找，看是哪个祖先创建了层叠上下文。浏览器开发者工具的 3D View 或 Layers 面板能直接看到层次。</p>
<p>再检查祖先有没有 <code>overflow: hidden</code>，元素可能是被裁掉了，不是被盖住了。</p>
<p>写组件时，可以用 <code>isolation: isolate</code> 主动给组件创建一个上下文。它没有别的副作用，组件内部的 z-index 就不会和外面冲突。</p>
<h2>常见追问</h2>
<p><strong>项目里的 z-index 怎么管理才不乱？</strong></p>
<blockquote>
<p>定义少量有名字的层级变量，比如 <code>--z-dropdown</code>、<code>--z-modal</code>，大家都用变量，不随手写数字。弹层尽量用 dialog 和 popover，它们进顶层，不用跟别人比 z-index。</p>
</blockquote>`};export{e as default};