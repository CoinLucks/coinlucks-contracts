// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin contracts
import "@openzeppelin/contracts/interfaces/IERC165.sol";

library AddressUtil {
    function isContract(address account) internal view returns (bool) {
        return account.code.length > 0;
    }

    function isNFT(address addr) internal view returns (bool) {
        return isERC721(addr) || isERC1155(addr);
    }

    function isERC721(address addr) internal view returns (bool) {
        try IERC165(addr).supportsInterface(0x80ac58cd) returns (bool result) {
            return result;
        } catch {
            return false;
        }
    }

    function isERC1155(address addr) internal view returns (bool) {
        try IERC165(addr).supportsInterface(0xd9b67a26) returns (bool result) {
            return result;
        } catch {
            return false;
        }
    }

    function isERC20(address addr) internal view returns (bool) {
        (bool success, ) = addr.staticcall(abi.encodeWithSelector(0x18160ddd)); // totalSupply()
        (bool success2, ) = addr.staticcall(abi.encodeWithSelector(0x70a08231, address(0))); // balanceOf(address)
        (bool success3, ) = addr.staticcall(abi.encodeWithSelector(0xdd62ed3e, address(0), address(0))); // allowance(address,address)
        return success && success2 && success3;
    }
}
