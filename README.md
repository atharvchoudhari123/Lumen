# Lumen

> A modern, modular web proxy and rewriting engine built from scratch.

Lumen is an experimental open-source proxy project designed to explore how modern web applications can be fetched, processed, and served through a custom proxy layer.

## ✨ Features

* 🚀 Fast Node.js-based server
* 🌐 HTTP/HTTPS resource proxying
* 🔗 URL rewriting
* 📄 HTML resource rewriting
* 🎨 CSS resource handling
* 📦 Static asset proxying
* 🧩 Modular architecture
* 🔒 Configurable security controls
* 🛠️ Designed to be extended over time

## 🏗️ Architecture

```text
Browser
   │
   ▼
┌───────────────┐
│     Lumen     │
│               │
│ URL Parser    │
│      ↓        │
│ HTTP Client   │
│      ↓        │
│ Rewriter      │
│      ↓        │
│ Response      │
└───────┬───────┘
        │
        ▼
   Target Website
```

Lumen receives a request, retrieves the requested resource, processes it when necessary, rewrites relevant URLs, and sends the result back to the browser.

## 📁 Project Structure

```text
lumen/
├── src/
│   ├── server/
│   ├── proxy/
│   ├── rewrite/
│   └── utils/
├── public/
├── package.json
├── README.md
└── LICENSE
```

> The structure may change as development continues.

## 🚀 Getting Started

### Requirements

* Node.js 20+
* npm

### Installation

```bash
git clone https://github.com/atharvchoudhari123/Lumen.git
cd Lumen
npm install
```

### Development

```bash
npm start
```

Then open the local address shown by the server.

## 🧪 Development Status

Lumen is currently under active development.

The project is being built incrementally, starting with basic proxying and URL rewriting before expanding into more advanced web-application compatibility.

### Roadmap

* [ ] Basic HTTP proxy
* [ ] HTTPS support
* [ ] HTML rewriting
* [ ] CSS rewriting
* [ ] JavaScript URL rewriting
* [ ] Cookie handling
* [ ] Redirect handling
* [ ] Streaming responses
* [ ] WebSocket support
* [ ] Caching
* [ ] Improved browser compatibility
* [ ] Security and abuse protections

## ⚠️ Disclaimer

Lumen is intended for **legitimate development, testing, research, and educational purposes**.

Do not use Lumen to bypass access controls, violate website terms, or access content you are not authorized to access.

## 🤝 Contributing

Contributions, bug reports, and ideas are welcome.

1. Fork the repository
2. Create a branch
3. Make your changes
4. Test your changes
5. Open a pull request

