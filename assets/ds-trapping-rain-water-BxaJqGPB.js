var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>接雨水是给一排宽度为 1 的柱子高度，问下雨后能存多少水。看单根柱子就好想：它上方的水面高度，取决于它左边最高的柱子和右边最高的柱子里较矮的那一根，水面减去它自己的高度就是这一格的水，结果小于 0 时按 0 算。</p>
<p>最直接的做法是先从左往右扫一遍，记下每个位置左边的最高值，再从右往左扫一遍记下右边的最高值，最后逐个结算，时间 O(n)、空间 O(n)。双指针把这两个数组省掉了：左右指针从两头往中间走，分别维护 <code>leftMax</code> 和 <code>rightMax</code>，哪边的最高值更矮，就结算哪边的指针并往里挪。</p>
<p>这样做成立，是因为如果 <code>leftMax</code> 比 <code>rightMax</code> 矮，左指针这一格的右边至少有一根 <code>rightMax</code> 那么高的柱子，所以它的水位只由 <code>leftMax</code> 决定，不用知道右边的完整情况。每个位置只结算一次，时间 O(n)，空间 O(1)。</p>
<p>要注意，这题和<a href="/questions/ds-two-pointers/">《双指针有哪些常见题型？》</a>里的盛水最多的容器不同，那题只选两根柱子，中间的柱子不挡水；接雨水每一格都要算。单调栈也能做，它按“一层一层横着填”的方式算，同样 O(n)。</p>
</blockquote>
<h2>双指针写法</h2>
<p>看 <code>leftMax &lt; rightMax</code> 时为什么只结算左边。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">trap</span>(<span class="hljs-params">height</span>) {
  <span class="hljs-keyword">let</span> left = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> right = height.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
  <span class="hljs-keyword">let</span> leftMax = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> rightMax = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> water = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">while</span> (left &lt;= right) {
    leftMax = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(leftMax, height[left]);
    rightMax = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(rightMax, height[right]);
    <span class="hljs-keyword">if</span> (leftMax &lt; rightMax) {
      water += leftMax - height[left];
      left++;
    } <span class="hljs-keyword">else</span> {
      water += rightMax - height[right];
      right--;
    }
  }
  <span class="hljs-keyword">return</span> water;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">trap</span>([<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>])); <span class="hljs-comment">// 6</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">trap</span>([<span class="hljs-number">4</span>, <span class="hljs-number">2</span>, <span class="hljs-number">0</span>, <span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">5</span>])); <span class="hljs-comment">// 9</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">trap</span>([<span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>])); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">trap</span>([<span class="hljs-number">2</span>, <span class="hljs-number">0</span>, <span class="hljs-number">2</span>])); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">trap</span>([<span class="hljs-number">5</span>])); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>为什么 <code>leftMax - height[left]</code> 不会是负数？因为每次结算前先用当前柱子更新了 <code>leftMax</code>，<code>leftMax</code> 至少等于这根柱子的高度，柱子比两边都高时结果就是 0，表示它上面存不了水。</p>
<p>为什么哪边矮就结算哪边？假设 <code>leftMax &lt; rightMax</code>。左指针这一格左边的最高值就是 <code>leftMax</code>，这是确定的。右边的最高值我们还不完全知道，可是右指针那一侧已经出现过 <code>rightMax</code>，所以右边的最高值不会低于 <code>rightMax</code>，也就比 <code>leftMax</code> 高。两边取较矮的，结果一定是 <code>leftMax</code>。反过来 <code>leftMax &gt;= rightMax</code> 时，同样的道理可以结算右边。</p>
<p><code>[3, 2, 1]</code> 越往右越矮，水全都流走了，结果是 0。<code>[2, 0, 2]</code> 中间那格两边都是 2，存 2 格水。</p>
<h2>单调栈怎么想</h2>
<p>单调栈是栈里的元素保持单调递减。从左往右扫，栈里存下标，当前柱子比栈顶高时，说明栈顶那根柱子成了一个“坑底”，左边是栈里的下一个元素，右边是当前柱子。弹出坑底，用两边较矮的高度减去坑底高度，乘以两边之间的宽度，就是这一层能填的水，然后继续和新的栈顶比较。每个下标入栈出栈各一次，时间 O(n)，栈最多 O(n)。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">trapByStack</span>(<span class="hljs-params">height</span>) {
  <span class="hljs-keyword">const</span> stack = [];
  <span class="hljs-keyword">let</span> water = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; height.<span class="hljs-property">length</span>; i++) {
    <span class="hljs-keyword">while</span> (stack.<span class="hljs-property">length</span> &amp;&amp; height[i] &gt; height[stack[stack.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>]]) {
      <span class="hljs-keyword">const</span> bottom = stack.<span class="hljs-title function_">pop</span>();
      <span class="hljs-keyword">if</span> (!stack.<span class="hljs-property">length</span>) <span class="hljs-keyword">break</span>;
      <span class="hljs-keyword">const</span> left = stack[stack.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>];
      <span class="hljs-keyword">const</span> level = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(height[left], height[i]) - height[bottom];
      water += level * (i - left - <span class="hljs-number">1</span>);
    }
    stack.<span class="hljs-title function_">push</span>(i);
  }
  <span class="hljs-keyword">return</span> water;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">trapByStack</span>([<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>])); <span class="hljs-comment">// 6</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">trapByStack</span>([<span class="hljs-number">4</span>, <span class="hljs-number">2</span>, <span class="hljs-number">0</span>, <span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">5</span>])); <span class="hljs-comment">// 9</span>
</code></pre></div>
<p>弹出坑底后栈空了，说明坑的左边没有挡板，水会流走，所以直接 <code>break</code>。双指针按列竖着算，单调栈按层横着算，两种方法加起来的总量一样。</p>
<h2>常见追问</h2>
<p><strong>为什么循环条件是 <code>left &lt;= right</code>？</strong></p>
<blockquote>
<p>每一格都要结算一次。两个指针相遇的那一格还没算过，用 <code>&lt;=</code> 才会处理它。那一格通常是最高的柱子，结算出来是 0，所以写成 <code>&lt;</code> 一般也能得到同样的答案，但 <code>&lt;=</code> 的含义更清楚。</p>
</blockquote>
<p><strong>二维的接雨水怎么做？</strong></p>
<blockquote>
<p>给的是一个高度矩阵，水可以往四个方向流。做法是把最外一圈放进最小堆，每次取出最矮的边界，向四周扩展，比它矮的格子能存的水就是它们的高度差。这和一维双指针“从矮的一边先结算”是同一个思路。</p>
</blockquote>`};export{e as default};