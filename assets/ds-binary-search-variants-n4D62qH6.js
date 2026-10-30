var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>最基本的二分是在有序数组里找某个数在不在。面试常考的是它的变体：数组里有重复的 8，要找第一个 8 和最后一个 8 的下标；或者数组被旋转过，比如 <code>[4, 5, 6, 7, 0, 1, 2]</code>，还要在 O(log n) 里找到目标。</p>
<p>找边界用两次二分。第一次找第一个大于等于目标的位置，这就是第一次出现的下标；第二次找第一个大于目标的位置，减 1 就是最后一次出现的下标。如果第一次找到的位置越界了，或者那里的值不等于目标，说明目标不存在，返回 <code>[-1, -1]</code>。</p>
<p>旋转数组整体不是有序的，但从中点切开，左右两半至少有一半是有序的。比较 <code>nums[left]</code> 和 <code>nums[mid]</code>，前者小于等于后者，说明左半边有序，否则右半边有序。目标落在有序那一半的范围里，就去那一半找，不然去另一半，这样每次仍然能排除一半。</p>
<p>写二分最容易错的是区间和循环条件不配套。选定一种写法，比如左闭右开 <code>[left, right)</code> 配 <code>left &lt; right</code>，或者左闭右闭 <code>[left, right]</code> 配 <code>left &lt;= right</code>，整段代码保持一致，空数组和只有一个元素的情况都要能跑通。</p>
</blockquote>
<h2>找第一个和最后一个位置</h2>
<p>下面的 <code>lowerBound</code> 用左闭右开区间，返回第一个 <code>&gt;= target</code> 的下标。把比较条件改成 <code>&lt;=</code>，就得到第一个 <code>&gt; target</code> 的下标。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">lowerBound</span>(<span class="hljs-params">nums, target, inclusive = <span class="hljs-literal">false</span></span>) {
  <span class="hljs-keyword">let</span> left = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> right = nums.<span class="hljs-property">length</span>;
  <span class="hljs-keyword">while</span> (left &lt; right) {
    <span class="hljs-keyword">const</span> mid = left + <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>((right - left) / <span class="hljs-number">2</span>);
    <span class="hljs-comment">// inclusive 为 true 时跳过所有等于 target 的值，找第一个大于 target 的位置。</span>
    <span class="hljs-keyword">if</span> (nums[mid] &lt; target || (inclusive &amp;&amp; nums[mid] === target)) left = mid + <span class="hljs-number">1</span>;
    <span class="hljs-keyword">else</span> right = mid;
  }
  <span class="hljs-keyword">return</span> left;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">searchRange</span>(<span class="hljs-params">nums, target</span>) {
  <span class="hljs-keyword">const</span> first = <span class="hljs-title function_">lowerBound</span>(nums, target);
  <span class="hljs-keyword">if</span> (first === nums.<span class="hljs-property">length</span> || nums[first] !== target) <span class="hljs-keyword">return</span> [-<span class="hljs-number">1</span>, -<span class="hljs-number">1</span>];
  <span class="hljs-keyword">return</span> [first, <span class="hljs-title function_">lowerBound</span>(nums, target, <span class="hljs-literal">true</span>) - <span class="hljs-number">1</span>];
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">searchRotated</span>(<span class="hljs-params">nums, target</span>) {
  <span class="hljs-keyword">let</span> left = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> right = nums.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
  <span class="hljs-keyword">while</span> (left &lt;= right) {
    <span class="hljs-keyword">const</span> mid = left + <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>((right - left) / <span class="hljs-number">2</span>);
    <span class="hljs-keyword">if</span> (nums[mid] === target) <span class="hljs-keyword">return</span> mid;
    <span class="hljs-keyword">if</span> (nums[left] &lt;= nums[mid]) {
      <span class="hljs-comment">// 左半边 [left, mid] 有序</span>
      <span class="hljs-keyword">if</span> (nums[left] &lt;= target &amp;&amp; target &lt; nums[mid]) right = mid - <span class="hljs-number">1</span>;
      <span class="hljs-keyword">else</span> left = mid + <span class="hljs-number">1</span>;
    } <span class="hljs-keyword">else</span> {
      <span class="hljs-comment">// 右半边 [mid, right] 有序</span>
      <span class="hljs-keyword">if</span> (nums[mid] &lt; target &amp;&amp; target &lt;= nums[right]) left = mid + <span class="hljs-number">1</span>;
      <span class="hljs-keyword">else</span> right = mid - <span class="hljs-number">1</span>;
    }
  }
  <span class="hljs-keyword">return</span> -<span class="hljs-number">1</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">searchRange</span>([<span class="hljs-number">5</span>, <span class="hljs-number">7</span>, <span class="hljs-number">7</span>, <span class="hljs-number">8</span>, <span class="hljs-number">8</span>, <span class="hljs-number">10</span>], <span class="hljs-number">8</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 3,4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">searchRange</span>([<span class="hljs-number">5</span>, <span class="hljs-number">7</span>, <span class="hljs-number">7</span>, <span class="hljs-number">8</span>, <span class="hljs-number">8</span>, <span class="hljs-number">10</span>], <span class="hljs-number">6</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// -1,-1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">searchRange</span>([], <span class="hljs-number">0</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// -1,-1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">searchRotated</span>([<span class="hljs-number">4</span>, <span class="hljs-number">5</span>, <span class="hljs-number">6</span>, <span class="hljs-number">7</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>], <span class="hljs-number">0</span>)); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">searchRotated</span>([<span class="hljs-number">4</span>, <span class="hljs-number">5</span>, <span class="hljs-number">6</span>, <span class="hljs-number">7</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>], <span class="hljs-number">3</span>)); <span class="hljs-comment">// -1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">searchRotated</span>([<span class="hljs-number">1</span>], <span class="hljs-number">0</span>)); <span class="hljs-comment">// -1</span>
</code></pre></div>
<p>这些输入都是 LeetCode 34 题和 33 题题面里的例子。</p>
<p><code>searchRange</code> 里为什么第二次二分要减 1？第二次找到的是第一个大于 8 的位置，也就是 10 的下标 5，最后一个 8 就在它前面一格，下标 4。</p>
<p>为什么第一次二分之后要检查 <code>nums[first] !== target</code>？<code>lowerBound</code> 找的是第一个大于等于目标的位置，目标不存在时它也会返回一个位置。找 6 时，它返回 1，那里是 7，不等于 6，所以要返回 <code>[-1, -1]</code>。目标比所有数都大时，它返回数组长度，这时先判断 <code>first === nums.length</code>，避免读到数组外面。</p>
<h2>旋转数组里怎样判断哪一半有序</h2>
<p><code>[4, 5, 6, 7, 0, 1, 2]</code> 是把 <code>[0, 1, 2, 4, 5, 6, 7]</code> 从 4 那里切开、前后调换得到的。数组里有一个“断点”，就是 7 到 0 那里。从中点切开，断点只可能在其中一半，另一半一定是有序的。</p>
<p>所以先看左半边：<code>nums[left] &lt;= nums[mid]</code> 说明从 <code>left</code> 到 <code>mid</code> 没有断点，是有序的。这时判断目标在不在 <code>nums[left]</code> 到 <code>nums[mid]</code> 之间，在就去左边找，不在就去右边找。右半边有序时同理。</p>
<p>为什么是 <code>&lt;=</code> 而不是 <code>&lt;</code>？当 <code>left === mid</code> 时，左半边只有一个元素，它当然是有序的，这时两者相等，必须算作左半边有序。如果写成 <code>&lt;</code>，就会误判成右半边有序。</p>
<p>要注意，这个写法依赖“元素互不相同”。LeetCode 33 题明确说了数组元素各不相同。如果有重复值，比如 <code>[1, 0, 1, 1, 1]</code>，<code>nums[left]</code>、<code>nums[mid]</code>、<code>nums[right]</code> 可能全部相等，判断不出哪一半有序，只能把 <code>left</code> 加 1 缩小一点，最坏情况退化成 O(n)。</p>
<h2>两种区间写法怎么选</h2>
<p>左闭右开 <code>[left, right)</code> 里，<code>right</code> 指向的位置不在搜索范围内，所以初始值是 <code>nums.length</code>，循环条件是 <code>left &lt; right</code>，缩小右边界时写 <code>right = mid</code>。这种写法适合找边界，因为结果可能是 <code>nums.length</code>，表示插入到最后。</p>
<p>左闭右闭 <code>[left, right]</code> 里，<code>right</code> 也在搜索范围内，初始值是 <code>nums.length - 1</code>，循环条件是 <code>left &lt;= right</code>，缩小时写 <code>right = mid - 1</code>。这种写法适合“找到就返回”的场景，比如上面的旋转数组。</p>
<p>中点写成 <code>left + Math.floor((right - left) / 2)</code>，原因见<a href="/questions/alg-lower-bound/">《二分查找怎样定位时间轴边界？为什么重复值和空数组容易写错？》</a>。</p>
<h2>常见追问</h2>
<p><strong>怎样找旋转数组里的最小值？</strong></p>
<blockquote>
<p>比较 <code>nums[mid]</code> 和 <code>nums[right]</code>。<code>nums[mid] &gt; nums[right]</code> 说明断点在右半边，最小值在 <code>mid</code> 右侧，令 <code>left = mid + 1</code>；否则最小值在 <code>mid</code> 或它左侧，令 <code>right = mid</code>。循环到 <code>left === right</code> 时，那个位置就是最小值。</p>
</blockquote>
<p><strong>二分查找还能用在什么地方？</strong></p>
<blockquote>
<p>只要答案具有单调性就能用，不一定是在数组里找数。比如“最少需要多大的容量才能在 D 天内运完货物”，容量越大越容易满足，就可以对容量做二分，每次检查这个容量够不够。</p>
</blockquote>`};export{e as default};