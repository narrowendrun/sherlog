# sherlog

An innovative web application designed to emulate a switch CLI for streamlined interaction with tech-support files. It allows users to effortlessly upload and run switch commands with advanced features such as tab autocompletion, command prompts using ‘?’, Linux-style piping and ‘intuitive search’.

## Features

- upload your tech-support file(s) (.gz and .log)
- 'tab'for autocomplete and '?' for command prompts
- intuitive command search with `Shift + Enter`
- notes for keeping track of quick pointers
- command history to keep track of your commands
- fileswitcher to keep the files you have uploaded organized

## Deployment

Clone the project

```bash
   git clone https://github.com/narrowendrun/sherlog.git
```

This project can be run as a docker container (recommended) and locally

### Docker

Please ensure to install [docker](https://www.docker.com/products/docker-desktop/) and have the daemon running

```bash
   cd /path/to/sherlog
   docker-compose up -d --build
```

Access sherlog from http://localhost:3000/

### Run Locally

Go to the reactpage directory

```bash
   cd /path/to/sherlog
   cd reactpage
```

Edit the target URL in vite.config.js by uncommenting the target key-value pair that correspondds to `running locally`

```js
//for running locally using npm run dev
//target: "http://127.0.0.1:5000",
```

Install dependencies on the `reactpage` directory

```bash
   npm install
```

Go to the flaskserver directory

```bash
   cd /path/to/sherlog
   cd flaskserver
```

Install dependencies

###### note: if your shell does not recognise `pip` try using `pip3`

```bash
  pip install -r requirements.txt
```

Start the servers from the appropriate directories

```bash
   cd /path/to/sherlog/reactpage
   npm run build
   npm run preview
```

###### note: if your shell does not recognise `flask` try executing `python app.py`

```bash
   cd /path/to/sherlog/flaskserver/
   flask run
```
