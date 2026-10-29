var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个 Vue 或 React 项目 <code>npm run build</code> 以后得到一个 <code>dist</code> 目录，里面全是静态文件。用 Docker 部署，就是做一个镜像：先在 Node 环境里构建出 <code>dist</code>，再把它复制进 nginx 镜像的 <code>/usr/share/nginx/html</code>，由 Nginx 提供服务。</p>
<p>Dockerfile 用多阶段构建。第一阶段装依赖、跑构建，第二阶段从 nginx 镜像开始，只复制构建产物。这样最终镜像里没有 Node 和 <code>node_modules</code>，体积小，暴露面也小。</p>
<p>Nginx 常配四件事。history 路由要写 <code>try_files $uri $uri/ /index.html</code>，否则刷新深层页面会 404。<code>gzip on</code> 并用 <code>gzip_types</code> 加上 JS、CSS、JSON 等类型，默认只压缩 <code>text/html</code>。缓存上，<code>index.html</code> 设 <code>no-cache</code>，带哈希的资源设一年的 <code>immutable</code>。接口用 <code>location /api/</code> 加 <code>proxy_pass</code> 转发给后端，顺便避开跨域。</p>
<p>要注意 <code>add_header</code> 的继承规则：某一层 <code>location</code> 里只要写了一条 <code>add_header</code>，上一层的所有 <code>add_header</code> 就都不继承了，安全头常常因此丢失。</p>
</blockquote>
<h2>Dockerfile 怎样写</h2>
<p>Docker 官方文档对多阶段构建的解释是：每条 <code>FROM</code> 开始一个新的构建阶段，可以用 <code>COPY --from</code> 从前一个阶段只拿需要的产物，构建工具不会留在最终镜像里。</p>
<div class="not-prose code-block"><div class="code-language">dockerfile</div><pre><code class="hljs language-dockerfile"># 第一阶段：构建
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 第二阶段：只放静态文件和 Nginx 配置
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
</code></pre></div>
<p>先复制 <code>package.json</code> 和 lockfile、装完依赖再复制源码，是为了利用层缓存：只改了业务代码时，<code>npm ci</code> 那一层可以直接复用。<code>npm ci</code> 和 <code>npm install</code> 的区别见<a href="/questions/engineering-lockfile/">《为什么需要提交 lockfile？npm ci 和 npm install 有何区别？》</a>。</p>
<p><code>/usr/share/nginx/html</code> 是 nginx 官方镜像文档里静态内容的目录，<code>/etc/nginx/conf.d/default.conf</code> 是它默认的站点配置，直接覆盖就行。项目根目录还应该放一个 <code>.dockerignore</code>，至少排除 <code>node_modules</code>，避免把本地依赖发送到构建上下文里。</p>
<p>构建和运行：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">docker build -t my-web .
docker run -d -p 8080:80 my-web
</code></pre></div>
<h2>Nginx 配置怎样写</h2>
<p>下面是一份典型的单页应用配置，后面逐段解释：</p>
<div class="not-prose code-block"><div class="code-language">nginx</div><pre><code class="hljs language-nginx">server {
  listen 80;
  root /usr/share/nginx/html;

  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;
  gzip_min_length 1024;

  location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control &quot;no-cache&quot;;
  }

  location /assets/ {
    try_files $uri =404;
    add_header Cache-Control &quot;public, max-age=31536000, immutable&quot;;
  }

  location /api/ {
    proxy_pass http://backend:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
</code></pre></div>
<h3>history 路由为什么要 try_files</h3>
<p>前端路由用 history 模式时，地址是 <code>/orders/42</code> 这样的路径。用户刷新页面，浏览器真的会去请求这个路径，可服务器上没有这个文件。</p>
<p>nginx 文档对 <code>try_files</code> 的说明是：按顺序检查文件是否存在，用第一个找到的文件处理请求；参数末尾加斜杠表示检查目录；都找不到时，内部重定向到最后一个参数指定的 URI。所以 <code>$uri $uri/ /index.html</code> 的意思是“有这个文件就返回文件，有这个目录就用目录，都没有就返回 <code>index.html</code>，交给前端路由处理”。</p>
<p><code>/assets/</code> 下不应该回退。写成 <code>try_files $uri =404</code>，缺失的 JS 文件会真的返回 404，而不是返回一份 HTML，导致浏览器报“MIME 类型不对”这种难懂的错误。回退到 <code>index.html</code> 对 SEO 的影响（不存在的页面也返回 200）见<a href="/questions/render-seo-deploy/">《前端渲染方式怎样影响 SEO 和部署？》</a>。</p>
<h3>gzip 为什么要配 gzip_types</h3>
<p><code>gzip</code> 默认是 off。<code>gzip_types</code> 的默认值是 <code>text/html</code>，文档说它是在 <code>text/html</code> 之外再追加要压缩的 MIME 类型，所以 JS、CSS、JSON 都要自己写上。<code>gzip_min_length</code> 设定压缩的最小响应长度，太小的文件压缩收益不大。图片、字体这类已经压缩过的格式不用再加。</p>
<p>如果前面还有 CDN，可以加 <code>gzip_vary on</code>，它会插入 <code>Vary: Accept-Encoding</code> 响应头，避免缓存把压缩版本发给不支持的客户端。</p>
<h3>缓存头怎样设</h3>
<p>入口 <code>index.html</code> 文件名不变，必须每次向服务器确认，用户才能拿到新版本，所以设 <code>no-cache</code>。构建产物带内容哈希，内容一变文件名就变，可以放心长期缓存，所以设一年加 <code>immutable</code>。为什么这样设，以及部署时为什么不能马上删旧资源，见<a href="/questions/git-static-deploy/">《静态托管发布时为什么要检查资源路径和缓存？》</a>。</p>
<p><code>add_header</code> 有两个坑都写在文档里。第一，它默认只对 200、201、204、206、301、302、303、304、307、308 这些状态码生效，想让 404、500 也带上，要加 <code>always</code> 参数。第二，继承规则：上一层的 <code>add_header</code> 只在当前层<strong>没有任何</strong> <code>add_header</code> 时才会继承。如果在 <code>server</code> 层写了安全头，又在 <code>location /assets/</code> 里加了 <code>Cache-Control</code>，这个 location 的响应就不再带安全头。常见做法是把公共头放进一个文件，在每个 location 里 <code>include</code>。nginx 1.29.3 起新增了 <code>add_header_inherit</code> 指令，设为 <code>merge</code> 可以把上一层的值追加进来，用之前要确认服务器版本。</p>
<h3>反向代理怎样写</h3>
<p><code>proxy_pass</code> 后面带不带 URI，行为不同。文档的说明是：带了 URI（哪怕只是一个 <code>/</code>），请求路径中与 location 匹配的部分会被替换成这个 URI；不带 URI，则原样转发请求路径。所以上面配置里，<code>/api/users</code> 会被转发成后端的 <code>/users</code>。如果写成 <code>proxy_pass http://backend:3000;</code>，后端收到的就是 <code>/api/users</code>。</p>
<p>默认情况下，Nginx 会把转发请求的 <code>Host</code> 头改成 <code>$proxy_host</code>，也就是 <code>proxy_pass</code> 里写的地址。后端需要知道原始域名时，要显式设 <code>proxy_set_header Host $host</code>。真实客户端 IP 也要通过 <code>X-Real-IP</code>、<code>X-Forwarded-For</code> 传过去。</p>
<p>前端和接口同源以后，浏览器就不需要 CORS 了。代理解决跨域的原理见<a href="/questions/http-cross-origin-solutions/">《跨域有哪些解决方案？JSONP 和代理是怎样工作的？》</a>。</p>
<h2>常见追问</h2>
<p><strong>配置里的后端地址每个环境都不一样，怎么办？</strong></p>
<blockquote>
<p>nginx 官方镜像支持模板：把配置写成 <code>/etc/nginx/templates/default.conf.template</code>，里面引用环境变量，容器启动时会用 <code>envsubst</code> 替换后输出到 <code>/etc/nginx/conf.d</code>。这样同一个镜像就能用不同的环境变量部署到测试和生产环境。</p>
</blockquote>
<p><strong>前端的环境变量能在容器启动时改吗？</strong></p>
<blockquote>
<p>构建时注入的变量已经写死在 JS 里了，启动容器时改环境变量不会生效。要么每个环境单独构建，要么让前端在运行时请求一个配置文件。而且无论哪种，都不能放密钥，见<a href="/questions/eng-env/">《为什么前端环境变量不能存放秘密？》</a>。</p>
</blockquote>
<p><strong>为什么改了 Nginx 配置不生效？</strong></p>
<blockquote>
<p>先用 <code>nginx -t</code> 检查语法，再 <code>nginx -s reload</code> 重新加载。用 Docker 部署时，配置是打进镜像的，要重新构建镜像或者用卷挂载配置。还要检查是不是有更精确的 <code>location</code> 先匹配了请求。</p>
</blockquote>`};export{e as default};