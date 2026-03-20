// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockCUSD
 * @notice Test-only ERC20 mimicking Celo Dollar (cUSD) for local/Alfajores testing.
 *         Anyone can mint tokens for themselves — do not deploy to mainnet.
 */
contract MockCUSD is ERC20, Ownable {

    constructor() ERC20("Celo Dollar (Mock)", "cUSD") Ownable(msg.sender) {
        // Mint 1,000,000 cUSD to deployer for testing
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }

    /// @notice Mint test tokens to any address (testnet only)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @notice Faucet: mint 1000 cUSD to caller for testing
    function faucet() external {
        _mint(msg.sender, 1000 * 10 ** 18);
    }
}
