/* global io,superagent */
var sigUtil = require('eth-sig-util')
// import GnosisTokenContract from './GnosisToken.json'

var body = document.body
var request = superagent

// elements
var form = body.querySelector('form#invite')
var channel = form.elements['channel'] || {}
var email = form.elements['email']
var coc = form.elements['coc']
var button = body.querySelector('button')

// remove loading state
button.className = ''

//detect metamask web3
window.addEventListener('load', function() {

  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
    console.log('using metamask')
  } else {
    console.log('No web3? You should consider trying MetaMask!')
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

})

// require metamask signature using web3 1.0
// TODO: WEB3 1.0 NOT IMPLEMENTED YET IN METAMASK
// ethSignButton.addEventListener('click', function(event) {
//   event.preventDefault()
//   var msg = 'Send a slack invite for gnosis to ' + email.value
//   var from = web3.eth.accounts[0]
//   web3.eth.personal.sign(web3.utils.utf8tohex(msg), from, function (err, result) {
//     if (err) return console.error(err)
//     console.log('SIGNED:' + result)
//
//     //handle result by checking if account holds gno
//     // Same data as before
//     // var r = web3.toBuffer(result.slice(0,66))
//     // var s = web3.toBuffer('0x' + result.slice(66,130))
//     // var v = web3.toBuffer('0x' + result.slice(130,132))
//     // var m = web3.hashPersonalMessagem('Send a slack invite for gnosis to ' + email.value)
//     // var pub = web3.eth.personal.ecrecover(m, v, r, s)
//     // var adr = '0x' + web3.pubToAddress(pub).toString('hex')
//     // console.log('Check ' + adr + ' for GNO Tokens')
//   })
// })

ethSignButton.addEventListener('click', function(event) {
  event.preventDefault()
  var text = 'Send a slack invite for gnosis to ' + email.value
  console.log(text)
  var msg = web3.toHex(text)
  // var msg = '0x1' // hexEncode(text)
  var from = web3.eth.accounts[0]

  console.log('CLICKED, SENDING PERSONAL SIGN REQ')
  var params = [msg, from]
  var method = 'personal_sign'

  web3.currentProvider.sendAsync({
    method,
    params,
    from,
  }, function (err, result) {
    if (err) return console.error(err)
    if (result.error) return console.error(result.error)
    console.log('PERSONAL SIGNED:' + JSON.stringify(result.result))

    console.log('recovering...')

    const msgParams = { data: msg }
    msgParams.sig = result.result
    console.dir({ msgParams })
    const recovered = sigUtil.recoverPersonalSignature(msgParams)
    console.dir({ recovered })

    if (recovered === from ) {
      console.log('SigUtil Successfully verified signer as ' + from)

      //handle result by checking if account holds gno
      console.log('Fetching Gnosis Token contract')
      const gnosisTokenABI = '[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"dutchAuction","type":"address"},{"name":"owners","type":"address[]"},{"name":"tokens","type":"uint256[]"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"}]'

      const gnosisTokenAddr = '0x6810e776880c02933d47db1b9fc05908e5386b96'

      const gnosisTokenContract = web3.eth.contract(JSON.parse(gnosisTokenABI)).at(gnosisTokenAddr)

      console.log('Checking GNO Balance')
      gnosisTokenContract.balanceOf(from, function(error, result){
          if (!error) {

              if (result.c[0] > 0) {
                  console.log('GNO Balance Verified. Sending Email Invite')
              } else {
                  console.log('ERROR The account you provided does not hold GNO Tokens')
              }

          } else {
              console.error('ERROR could not check GNO Balance ' + error)
          }
      })

      //    ECRECOVER code
      //   var r = utils.toBuffer(result.slice(0,66))
      //   var s = utils.toBuffer('0x' + result.slice(66,130))
      //   var v = utils.toBuffer('0x' + result.slice(130,132))
      //   var m = utils.hashPersonalMessagem('gnosis-pm')
      //   var pub = utils.ecrecover(m, v, r, s)
      //   var adr = '0x' + utils.pubToAddress(pub).toString('hex')
      //   console.log('Check ' + adr + ' for GNO Tokens')

    } else {
      console.dir(recovered)
      console.log('SigUtil Failed to verify signer when comparing ' + recovered.result + ' to ' + from)
      console.log('Failed, comparing %s to %s', recovered, from)
    }
  })
})

// capture submit
body.addEventListener('submit', function (ev){
  ev.preventDefault()
  button.disabled = true
  button.className = ''
  button.innerHTML = 'Please Wait'
  invite(channel ? channel.value : null, coc && coc.checked ? 1 : 0, email.value, function (err, msg){
    if (err) {
      button.removeAttribute('disabled')
      button.className = 'error'
      button.innerHTML = err.message
    } else {
      button.className = 'success'
      button.innerHTML = msg
    }
  })
})

function invite (channel, coc, email, fn){
  request
  .post(data.path + 'invite')
  .send({
    coc: coc,
    channel: channel,
    email: email
  })
  .end(function (res){
    if (res.body.redirectUrl) {
      var err = new Error(res.body.msg || 'Server error')
      window.setTimeout(function () {
        topLevelRedirect(res.body.redirectUrl)
      }, 1500)
    }
    if (res.error) {
      var err = new Error(res.body.msg || 'Server error')
      return fn(err)
    } else {
      fn(null, res.body.msg)
    }
  })
}

// use dom element for better cross browser compatibility
var url = document.createElement('a')
url.href = window.location
// realtime updates
var socket = io({ path: data.path + 'socket.io' })
socket.on('data', function (users){
  for (var i in users) update(i, users[i])
})
socket.on('total', function (n){ update('total', n) })
socket.on('active', function (n){ update('active', n) })

function update (val, n, noanim){
  var el = document.querySelector('.' + val)
  // if (n != el.innerHTML) {
  //   el.innerHTML = n
  //   anim(el, val)
  // }
}

function anim (el, c){
  if (el.anim) return
  el.className = c + ' grow'
  el.anim = setTimeout(function (){
    el.className = c
    el.anim = null
  }, 150)
}

// redirect, using "RPC" to parent if necessary
function topLevelRedirect (url) {
  if (window === top) location.href = url
  else parent.postMessage('slackin-redirect:' + id + ':' + url, '*')
  // Q: Why can't we just `top.location.href = url;`?
  // A:
  // [sandboxing]: http://www.html5rocks.com/en/tutorials/security/sandboxed-iframes/
  // [CSP]: http://www.html5rocks.com/en/tutorials/security/content-security-policy/
  // [nope]: http://output.jsbin.com/popawuk/16
};

// "RPC" channel to parent
var id
window.addEventListener('message', function onmsg (e){
  if (/^slackin:/.test(e.data)) {
    id = e.data.replace(/^slackin:/, '')
    window.removeEventListener('message', onmsg)
  }
})
