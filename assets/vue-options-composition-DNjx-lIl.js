var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写一个搜索页，有关键词、搜索结果、加载状态，还有分页。用 Options API 写，关键词放在 <code>data</code>，搜索函数放在 <code>methods</code>，“是否有结果”放在 <code>computed</code>，监听关键词变化放在 <code>watch</code>，一个“搜索”功能被拆散到四个地方。Composition API 则在 <code>setup</code> 或 <code>&lt;script setup&gt;</code> 里，用 <code>ref</code>、<code>computed</code>、<code>watch</code> 这些导入的函数，把搜索相关的代码写在一起。</p>
<p>这带来两个好处。一是功能复杂以后，同一件事的代码集中在一处，读起来不用上下跳；二是可以把一段逻辑原样抽成一个函数，比如 <code>useSearch()</code>，在多个组件里复用，替代 Vue 2 里容易命名冲突、来源不清的 mixin。它基于普通的变量和函数，TypeScript 也能更好地推导类型。</p>
<p>Options API 也有优点，它通过 <code>this</code> 访问组件实例，代码按选项分组，结构固定，对初学者更友好。Vue 官方文档说两者是同一套底层系统的不同接口，Options API 实际上是在 Composition API 之上实现的，可以按项目情况选择。</p>
</blockquote>
<h2>同一个功能两种写法</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Options API --&gt;
&lt;script&gt;
export default {
  data() {
    return { keyword: &#x27;&#x27;, results: [] };
  },
  computed: {
    empty() {
      return this.results.length === 0;
    },
  },
  watch: {
    keyword(value) {
      this.search(value);
    },
  },
  methods: {
    async search(value) {
      this.results = await fetchResults(value);
    },
  },
};
&lt;/script&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Composition API --&gt;
&lt;script setup&gt;
import { computed, ref, watch } from &#x27;vue&#x27;;

const keyword = ref(&#x27;&#x27;);
const results = ref([]);
const empty = computed(() =&gt; results.value.length === 0);

watch(keyword, async (value) =&gt; {
  results.value = await fetchResults(value);
});
&lt;/script&gt;
</code></pre></div>
<p>两段代码功能一样。第一段里，“搜索”分布在 <code>data</code>、<code>computed</code>、<code>watch</code>、<code>methods</code> 四个选项中；第二段里，所有搜索相关的代码挨在一起。现在只有一个功能还看不出差别，等组件里还有分页、筛选、导出，Options API 的每个选项都会混进几个功能的代码。</p>
<p>要复用时，把第二段里的几行剪出来放进 <code>function useSearch() { ...; return { keyword, results, empty }; }</code>，任何组件调用它就能拿到一套独立的状态。组合式函数怎样设计，见<a href="/questions/vue-composables/">《组合式函数和 mixin 相比有什么维护优势？》</a>。</p>
<h2>两种写法里状态是怎样按实例隔离的</h2>
<p>Options API 的 <code>data</code> 要写成返回对象的函数，Vue 每创建一个实例调用一次，各实例拿到各自的对象；Composition API 的 <code>setup</code> 本身就是每个实例执行一次，里面创建的 <code>ref</code> 自然属于这个实例。为什么 <code>data</code> 不能直接写成对象，见<a href="/questions/vue-data-function/">《Vue 组件的 data 为什么必须是函数？》</a>。</p>
<h2>常见追问</h2>
<p><strong>Composition API 里为什么没有 this？</strong></p>
<blockquote>
<p><code>setup</code> 在组件实例完全创建之前执行，那时还没有可用的 <code>this</code>。状态都是 <code>setup</code> 里的局部变量，通过闭包被模板和函数访问，所以也不需要 <code>this</code>。</p>
</blockquote>
<p><strong>Composition API 会不会让代码更乱？</strong></p>
<blockquote>
<p>如果把所有代码都堆在 <code>setup</code> 里不加组织，确实会更乱。好的做法是按功能分段，把复杂逻辑抽成组合式函数，组件里只负责把它们组合起来。Options API 的结构是框架强制的，Composition API 的结构要靠开发者自己维护。</p>
</blockquote>
<p><strong>两种写法能混用吗？</strong></p>
<blockquote>
<p>能。组件可以同时写 <code>setup()</code> 和其他选项，<code>setup</code> 返回的值可以在选项里通过 <code>this</code> 访问。但同一个项目最好统一风格，新代码一般用 Composition API。</p>
</blockquote>`};export{e as default};