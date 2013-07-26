//
//  Reitsuki.m
//  Moxie
//
//  Created by sora kasugano on 13-7-25.
//
//

#import "Reitsuki.h"

@implementation Reitsuki
- (void)getFileNamesInAPP:(CDVInvokedUrlCommand *)command
{
    NSMutableArray *filenamelist = [NSMutableArray arrayWithCapacity:10];
    NSString *subPath = @"";
    NSString *appPath = [[NSBundle mainBundle] resourcePath];
    if([command.arguments count] > 0){
        subPath = [command.arguments objectAtIndex:0];
    }

    
    NSString *fullPath = [appPath stringByAppendingPathComponent:subPath];
    CDVPluginResult* pluginResult = nil;
    NSArray *tmplist = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:fullPath error:nil];
    for (NSString *filename in tmplist) {
        [filenamelist addObject:filename];
    }

    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:filenamelist];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}
@end
