//
//  Reitsuki.h
//  Moxie
//
//  Created by sora kasugano on 13-7-25.
//
//

#import <Foundation/Foundation.h>

#import <Cordova/CDV.h>
@interface Reitsuki : CDVPlugin
- (void)getFileNamesInAPP:(CDVInvokedUrlCommand*)command;
@end
