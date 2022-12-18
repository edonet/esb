# @ainc/esb
Let's do something nice with @ainc/esb!

## Install
``` shell
$ yarn global add @ainc/esb
```

## Usage
``` shell
$ esb -p ./src
```

## VS Code
``` json
{
  "name": "Launch Script",
  "type": "node",
  "request": "launch",
  "autoAttachChildProcesses": true,
  "runtimeExecutable": "esb",
  "args": [
    "${file}"
  ]
}
```
