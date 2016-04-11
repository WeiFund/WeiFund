Template['components_setup'].rendered = function(){
	var template = this;

	//if(LocalStore.get('setup'))
	//	TemplateVar.set(template, 'setup', true);
};

Template['components_setup'].helpers({
	'rpcProvider': function(){
		return LocalStore.get('rpcProvider');
	},
	'ipfsProvider': function(){
		//return LocalStore.get('ipfsProvider').host + ':' + LocalStore.get('ipfsProvider').port;
	},
	'load': function(){
		var ethereumProvider = LocalStore.get('rpcProvider');
		var ipfsProvider = LocalStore.get('ipfsProvider');

		Meteor.setTimeout(function(){
			$('.btn-provider').removeClass("btn-primary");

			if(ethereumProvider === 'metamask')
				$('#useMetamask').addClass("btn-primary");

			if(ethereumProvider === 'etherscan')
				$('#useEtherscan').addClass("btn-primary");

			if(ethereumProvider !== 'metamask' && ethereumProvider !== 'etherscan')
				$('#useHTTPProvider').addClass("btn-primary");

			if(ipfsProvider.host === '159.203.69.164') {
				$('#useIPFSWeifund').addClass("btn-primary");
				$('#ipfsProvider').hide();
			} else {
				$('#useIPFSHTTP').addClass("btn-primary");
				$('#ipfsProvider').removeClass("hide");
				$('#ipfsProvider').val('http://localhost:5001')
				$('#ipfsProvider').show();
			}

		}, 300);
	}
});

var setEthereumProvider = function(ethereumProvider){
	ethereumProvider = ethereumProvider.trim();

	// add http
	if(ethereumProvider.indexOf('http://') === -1 && ethereumProvider != 'etherscan' && ethereumProvider != 'metamask')
		ethereumProvider = 'http://' + ethereumProvider;

	// Metamask Support
	if(ethereumProvider != 'metamask')
		web3.setProvider(new web3.providers.HttpProvider(ethereumProvider));

	// Etherscan Support
	if(ethereumProvider === 'etherscan')
		web3.setProvider(new EtherscanProvider({network: 'testnet'}));

	// MetaMask Provider
	if(ethereumProvider === 'metamask' && window.MetaMaskProvider)
		web3.setProvider(window.MetaMaskProvider);

	// Store provider locally
	LocalStore.set('rpcProvider', ethereumProvider);
};

var setIPFSProvider = function(ipfsProvider){
	if(ipfsProvider === 'weifund')
		ipfsProvider = '159.203.69.164:5001';

	var ipfsProviderData = ipfsProvider.split(":");
	var ipfsProviderHost = ipfsProviderData[0].replace("http://", "").replace("https://", ""),
		ipfsProviderPort = ipfsProviderData[1];
	var ipfsProviderObject = {host: ipfsProviderHost, port: ipfsProviderPort};

	// set provider
	try {
		// set provider
		ipfs.setProvider(ipfsProviderObject);

		// set local store
		LocalStore.set('ipfsProvider', ipfsProviderObject);

		// connect to WeiFund node
		ipfs.api.swarm.connect("/ip4/104.131.131.82/tcp/4001/ipfs/QmQaYRZbWMziMfpjZiNwK1dtnSngxrJGJ2RR62csp9g5qb", function(err, result){
			console.log(err, result);
		});
	}catch(E){}
};

function onEthereumProviderChange (event, template) {
	var ethereumProvider = Helpers.cleanAscii($('#ethereumProvider').val());

	// set etheruem provider
	setEthereumProvider(ethereumProvider);

	// get accounts and set one if available
	web3.eth.getAccounts(function(err, accounts){
		if(!err && accounts.length > 0)
			$('#ethereumAccount').val(accounts[0]);

			console.log(err, accounts);
	});
}

Template['components_setup'].events({
    /**
    Deploy the price feed, used for setup of contract.

    @event (click #setupClient)
    **/

    'click .blur': function(event, template){
			TemplateVar.set(template, 'setup', true);

			// Reroute if on setup
			if(!_.isUndefined(Router.current().route)
				   && Router.current().route._path == '/setup')
				Router.go('/');
		},

		'click #useMetamask': function(event, template) {
			$('#ethereumProvider').val("metamask");
			$('#ethereumProvider').hide();
			onEthereumProviderChange();

			$('.btn-provider').removeClass("btn-primary");
			$('#useMetamask').addClass("btn-primary");
		},

		'click #useHTTPProvider': function(event, template) {
			$('#ethereumProvider').removeClass("hide");
			$('#ethereumProvider').val("http://localhost:8080");
			$('#ethereumProvider').show();

			$('.btn-provider').removeClass("btn-primary");
			$('#useHTTPProvider').addClass("btn-primary");
		},

		'click #useEtherscan': function(event, template) {
			$('#ethereumProvider').val("etherscan");
			$('#ethereumProvider').hide();
			onEthereumProviderChange();

			$('.btn-provider').removeClass("btn-primary");
			$('#useEtherscan').addClass("btn-primary");
		},

		'click #useIPFSWeifund': function(event, template) {
			$('#ipfsProvider').val("weifund");
			$('#ipfsProvider').hide();
			setIPFSProvider($('#ipfsProvider').val());

			$('.btn-ipfs-provider').removeClass("btn-primary");
			$('#useIPFSWeifund').addClass("btn-primary");
		},

		'click #useIPFSHTTP': function(event, template) {
			$('#ipfsProvider').val("http://localhost:5001");
			$('#ipfsProvider').show();

			$('.btn-ipfs-provider').removeClass("btn-primary");
			$('#useIPFSHTTP').addClass("btn-primary");
		},

    /**
    Deploy the price feed, used for setup of contract.

    @event (click #setupClient)
    **/

    'change #ethereumProvider': onEthereumProviderChange,

    /**
    Deploy the price feed, used for setup of contract.

    @event (click #setupClient)
    **/

    'click #setupClient': function(event, template){
			try {
				var ethereumProvider = Helpers.cleanAscii($('#ethereumProvider').val()),
					ipfsProvider = Helpers.cleanAscii($('#ipfsProvider').val()),
					selectedAccount = Helpers.cleanAscii($('#ethereumAccount').val()),
					testIPFSHash = 'QmekvvCfcQg3LXXtUGeGy3kU4jGwg82txuZtVNRE8BvY9W';

				// Set state
				TemplateVar.set(template, 'state', {isTesting: true, testing: 'Ethereum Provider'});

				// Set Ethereum Provider
				setEthereumProvider(ethereumProvider);

				// Get Ethereum Accounts
				web3.eth.getAccounts(function(err, accounts){
					if(err)
						return TemplateVar.set(template, 'state', {isError: true, error: 'Ethereum Provider: ' + err});

					// Check if there are accounts
					if(accounts.length < 0)
						return TemplateVar.set(template, 'state', {isError: true, error: 'Your Ethereum provider must have accounts'});

					if(selectedAccount == "" && accounts.length > 1)
						selectedAccount = accounts[0];

					// set state
					TemplateVar.set(template, 'state', {isTesting: true});

					// try IPFS cat
					try  {
						// testing ipfs
						TemplateVar.set(template, 'state', {isTesting: true, testing: 'IPFS Provider'});

						// set IPFS provider
						setIPFSProvider(ipfsProvider);

						// Testing is Success
						TemplateVar.set(template, 'state', {isSuccess: true});
						LocalStore.set('setup', true);

						// Set Default Account
						Session.set('defaultAccount', selectedAccount);
						LocalStore.set('defaultAccount', selectedAccount);

						// Shutdown Setup WIndow
						TemplateVar.set(template, 'setup', true);

						// Reroute if on setup
						if(!_.isUndefined(Router.current().route)
							&& Router.current().route._path == '/setup')
							Router.go('/');
					}catch(err){
						return TemplateVar.set(template, 'state', {isError: true, error: err});
					}
				});
			}catch(err){
				return TemplateVar.set(template, 'state', {isError: true, error: err});
			}
	}
});