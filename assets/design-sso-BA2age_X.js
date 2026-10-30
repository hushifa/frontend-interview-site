var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>公司有 OA、邮箱、报销三个系统，员工在 OA 登录过以后，打开报销系统不用再输一次密码，这就是单点登录。做法是把登录统一交给一个认证中心，各个系统自己不再管密码。</p>
<p>如果所有系统都在同一个父域下，比如 <code>oa.example.com</code> 和 <code>pay.example.com</code>，最简单的办法是登录后把 Cookie 的 <code>Domain</code> 设成 <code>example.com</code>，所有子域都能带上。可是域名不同时 Cookie 没法共享，就要用跳转：系统发现用户没登录，把浏览器重定向到认证中心；认证中心看自己域名下有没有登录会话，没有就让用户登录，有就直接签发一个一次性的授权码，跳回原系统；原系统的后端拿授权码去认证中心换用户信息，再建立自己的会话。</p>
<p>所以第二个系统“免登录”，靠的是浏览器访问认证中心时带上了认证中心自己的 Cookie。这套流程现在通常用 OIDC 标准实现，换回来的 ID Token 告诉应用是谁登录了。</p>
<p>要注意三件事。授权码要在后端交换，回调要校验 <code>state</code>，防止登录请求被伪造。各系统登录后有自己的会话，认证中心退出了，各系统的会话不会自动失效，要专门做统一退出。另外不要依赖在 iframe 里读认证中心的 Cookie 来判断登录状态，越来越多浏览器默认限制第三方 Cookie。</p>
</blockquote>
<h2>同一个父域时：共享 Cookie</h2>
<p>所有系统都是 <code>example.com</code> 的子域时，认证服务登录成功后可以这样设置会话 Cookie：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Set-Cookie: sso_session=abc123; Domain=example.com; Path=/; Secure; HttpOnly; SameSite=Lax
</code></pre></div>
<p>MDN 说明，指定了 <code>Domain</code> 以后，这个域和它的所有子域都会收到这个 Cookie；<code>Domain</code> 只能是当前域或它的父域，不能设成别的域名。所以 <code>oa.example.com</code> 和 <code>pay.example.com</code> 的请求都会带上 <code>sso_session</code>，各系统的后端拿它去认证服务查询用户即可。</p>
<p>这种做法简单，但限制也明显：只能用于同一个父域；所有子域都能收到这个 Cookie，任何一个子域被攻破，会话就可能泄露。<code>HttpOnly</code>、<code>Secure</code> 和 <code>SameSite</code> 的作用见<a href="/questions/sec-cookies/">《HttpOnly、Secure 和 SameSite 分别保护什么？》</a>。</p>
<h2>不同域名时：跳转到认证中心</h2>
<p>假设报销系统是 <code>pay.com</code>，认证中心是 <code>sso.com</code>。用户第一次打开报销系统时，流程是这样的：</p>
<ol>
<li>报销系统发现自己没有登录会话，生成一个随机的 <code>state</code> 存到自己的 Cookie 里，然后把浏览器重定向到 <code>https://sso.com/authorize?client_id=pay&amp;redirect_uri=https://pay.com/callback&amp;state=...</code>。</li>
<li>浏览器访问 <code>sso.com</code>，认证中心发现没有自己的会话，显示登录页。用户登录成功，认证中心在 <code>sso.com</code> 下写一个会话 Cookie。</li>
<li>认证中心生成一个一次性的授权码，重定向回 <code>https://pay.com/callback?code=...&amp;state=...</code>。</li>
<li>报销系统先检查回来的 <code>state</code> 和自己存的是否一致，然后由后端带上自己的凭证，拿 <code>code</code> 去认证中心换取用户信息，建立报销系统自己的会话。</li>
</ol>
<p>之后用户打开 OA 系统 <code>oa.com</code>，第 1 步一样会跳到 <code>sso.com</code>。可这次浏览器带着 <code>sso.com</code> 的会话 Cookie，认证中心知道用户已经登录了，不再显示登录页，直接签发授权码跳回 OA。用户看到的只是页面闪了一下。</p>
<p>为什么回调里只给一次性的授权码，而不是直接把用户信息或 token 放在 URL 上？因为 URL 会出现在浏览器历史、服务器日志和 <code>Referer</code> 里。授权码只能用一次，而且要配合应用自己的凭证在后端交换，即使被看到也很难被利用。纯前端应用没有后端保存凭证，要用 PKCE 保护授权码，见<a href="/questions/security-oauth-pkce/">《OAuth 2.0 的 PKCE 解决了什么问题？》</a>。</p>
<p><code>state</code> 又是做什么的？它是应用在跳转前生成、回来时比对的随机值。OIDC 规范说明，把它和浏览器 Cookie 绑定可以防 CSRF，也就是防止攻击者把自己的授权码塞给受害者，让受害者登录进攻击者的账号。</p>
<h2>用 OIDC 标准化这套流程</h2>
<p>上面的流程就是 OIDC 授权码流程的样子。认证中心在 OIDC 里叫 OpenID Provider，各业务系统叫 Relying Party。用授权码换回来的除了 access token，还有一个 ID Token，它是一个签了名的 JWT，里面的 <code>iss</code> 说明是谁签发的，<code>sub</code> 是用户在这个认证中心里的唯一标识，<code>aud</code> 必须包含应用自己的 <code>client_id</code>，<code>exp</code> 是过期时间。</p>
<p>应用要校验 ID Token：签名、<code>iss</code> 是否等于认证中心、<code>aud</code> 是否包含自己、是否已过期。如果请求时带了 <code>nonce</code>，还要检查 ID Token 里的 <code>nonce</code> 是否一致，用来防重放。认用户时用 <code>iss</code> 加 <code>sub</code>，不要用邮箱。OAuth 2.0 和 OIDC 的分工见<a href="/questions/security-oidc/">《OpenID Connect 和 OAuth 2.0 分别解决什么问题？》</a>。</p>
<p>用标准协议的好处是，企业微信、钉钉、Google、各种身份平台都支持，业务系统不用为每家写一套对接逻辑。</p>
<h2>前端需要做什么</h2>
<p>前端能做的主要是“发现没登录就跳转”和“回调页处理”。比较稳妥的做法是让后端处理授权码交换和 token 保存，浏览器只拿到一个 <code>HttpOnly</code> 的会话 Cookie。IETF 关于浏览器应用的 OAuth 草案把这种做法叫 BFF 模式，并强烈建议处理敏感数据的应用采用它，因为 token 不进入浏览器，脚本就偷不走。</p>
<p>跳转前要把当前地址记下来，比如存在 <code>sessionStorage</code> 或者放进 <code>state</code> 对应的服务端记录里，登录回来以后跳回用户原本要去的页面。回调地址要在认证中心预先登记，认证中心只接受登记过的地址，防止授权码被发到攻击者的网站。</p>
<p>接口返回 401 时，前端统一跳去登录，但要防止多个请求同时 401 时重复跳转。</p>
<h2>已登录检测和静默登录</h2>
<p>有时希望用户打开页面时，不跳转就知道在认证中心是否已经登录。OIDC 提供了 <code>prompt=none</code> 参数：认证中心不能显示任何登录或授权页面，用户已登录就正常返回授权码，没登录就返回 <code>login_required</code> 这类错误。</p>
<p>这个请求以前常放在隐藏的 iframe 里发出。可是 iframe 里的 <code>sso.com</code> 相对页面来说是第三方，MDN 说明 Firefox 和 Safari 默认就限制第三方 Cookie，iframe 里可能根本带不上认证中心的会话，于是总是返回“未登录”。所以更可靠的做法是用顶层页面跳转，或者让应用自己的后端维护会话，用会话的有效期决定什么时候重新走一遍登录。</p>
<h2>退出登录怎样做到全部退出</h2>
<p>各系统登录后都有自己的会话，用户在 OA 点退出，只删掉 OA 的会话，其他系统还是登录状态，认证中心的会话也还在，下次一跳转又自动登录了。所以退出要分两步。</p>
<p>第一步是让认证中心退出。OIDC 的 RP-Initiated Logout 规范定义了做法：应用把浏览器重定向到认证中心的 <code>end_session_endpoint</code>，带上 <code>id_token_hint</code> 说明要退出哪个用户，以及登记过的 <code>post_logout_redirect_uri</code>，认证中心清掉自己的会话后再跳回来。</p>
<p>第二步是通知其他系统。Back-Channel Logout 规范定义了服务端之间的通知：认证中心直接向每个系统登记的 <code>backchannel_logout_uri</code> 发 POST 请求，携带一个签名的 <code>logout_token</code>，各系统收到后删掉对应用户的会话。这一步不经过浏览器，用户关掉了其他系统的页面也能生效。</p>
<h2>常见追问</h2>
<p><strong>SSO 和扫码登录、第三方登录是一回事吗？</strong></p>
<blockquote>
<p>不完全是。第三方登录，比如用微信登录某个网站，技术上也是跳到外部认证方再回来，只是认证方和应用属于不同公司。SSO 强调的是一次登录，多个系统通用，通常是公司内部的统一认证中心。扫码登录是一种认证方式，可以作为认证中心里的一种登录手段，见<a href="/questions/design-qr-login/">《扫码登录是怎样实现的？》</a>。</p>
</blockquote>
<p><strong>为什么不直接把 token 放在 URL 上带回各系统，省掉换码这一步？</strong></p>
<blockquote>
<p>这就是早期的隐式流程。token 出现在 URL 里，会进浏览器历史、可能通过 <code>Referer</code> 泄露，也没法确认收到 token 的确实是这个应用。所以现在的建议是用授权码流程，浏览器端应用加上 PKCE，IETF 的浏览器应用草案把隐式流程列为不推荐的做法。</p>
</blockquote>`};export{e as default};